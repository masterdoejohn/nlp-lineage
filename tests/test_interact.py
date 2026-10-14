import json, sys, re
from playwright.sync_api import sync_playwright
from harness import wrap, route
URL = wrap()
results = []
def ok(name, cond, detail=''):
    results.append((name, bool(cond), detail)); 
def setrange(lab, idx, value):
    lab.locator('input[type=range]').nth(idx).evaluate("(e, v) => { e.value = v; e.dispatchEvent(new Event('input', {bubbles: true})); }", str(value))
with sync_playwright() as p:
    b = p.chromium.launch()
    for vw, vh, motion in [(390, 844, 'reduce'), (1440, 900, 'no-preference')]:
        ctx = b.new_context(viewport={'width': vw, 'height': vh}, reduced_motion=motion, has_touch=vw < 900)
        pg = ctx.new_page(); errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        pg.on('console', lambda m: errs.append(m.text) if m.type == 'error' and 'ERR_FAILED' not in m.text else None)
        route(pg)
        pg.goto(URL); pg.wait_for_timeout(1200)
        T = f'[{vw}]'
        labs = pg.locator('.lab')
        L = lambda i: labs.nth(i)
        out = lambda i: L(i).locator('.lab-out').inner_text()
        # 1 ngram
        l = L(0); l.get_by_role('checkbox').check(); ok(T+'ngram share -> 20%', '20%' in out(0), out(0))
        l.get_by_role('button', name='Write a sentence').click(); ok(T+'ngram generate', 'Generated' in out(0), out(0)[-160:])
        l.locator('.seg button', has_text='sat').click(); ok(T+'ngram no-class msg', 'no class' in out(0))
        l.locator('.lab-reset').click(); ok(T+'ngram reset', not l.get_by_role('checkbox').is_checked() and l.locator('.seg button[aria-pressed=true]').inner_text() == 'bird')
        # 2 vectors
        l = L(1); l.get_by_role('button', name='Next step').click(); l.get_by_role('button', name='Next step').click()
        ok(T+'vectors king-man+woman=queen', '≈ queen' in out(1), out(1))
        l.locator('.seg button', has_text='prince').click(); l.get_by_role('button', name='Next step').click(); l.get_by_role('button', name='Next step').click()
        ok(T+'vectors prince-boy+girl=princess', '≈ princess' in out(1), out(1))
        l.locator('select').nth(0).select_option('queen'); l.locator('select').nth(1).select_option('woman'); l.locator('select').nth(2).select_option('boy')
        for _ in range(2): l.get_by_role('button', name='Next step').click()
        ok(T+'vectors custom select', 'queen − woman + boy' in out(1), out(1))
        ok(T+'vectors next disabled at end', l.get_by_role('button', name='Next step').is_disabled())
        l.locator('.lab-reset').click(); ok(T+'vectors reset', 'Step 1' in out(1) and l.locator('select').nth(0).input_value() == 'king')
        # 4 attention
        l = L(2); l.locator('.seg button', has_text='wide').click(); ok(T+'attention wide -> street', '“street”' in out(2), out(2))
        l.locator('.seg button', has_text='256').click(); l.get_by_role('checkbox').uncheck()
        ok(T+'attention collapse without division', 'Without the division' in out(2), out(2))
        top = l.locator('.attn-tok').nth(6).get_attribute('aria-label'); ok(T+'attention collapse ~100%', '100%' in top or '99' in top, top)
        l.locator('.attn-tok').nth(1).click(); ok(T+'attention change query', '“animal” gives' in out(2), out(2))
        l.locator('.lab-reset').click(); ok(T+'attention reset', '“it” gives the most attention to “animal”' in out(2), out(2))
        # 5 quiz ch3
        l = L(3); l.locator('.quiz-opt').nth(0).click(); ok(T+'quiz wrong', out(3).startswith('Not quite.'))
        l.locator('.quiz-opt').nth(1).click(); ok(T+'quiz right', out(3).startswith('Correct.') and l.locator('.quiz-opt.right .mark').inner_text() == '✓')
        # 6 mask
        l = L(4); l.locator('.seg button', has_text='BERT').click(); l.locator('.mask-tok').nth(5).click()
        ok(T+'mask bert', 'recover “mat”' in out(4) and '[MASK]' in out(4), out(4))
        ok(T+'mask bert full grid', l.locator('.mg-cell.see').count() == 49)
        l.locator('.seg button', has_text='GPT').click(); l.locator('.mask-tok').nth(0).click()
        ok(T+'mask gpt triangle', l.locator('.mg-cell.see').count() == 28 and 'next word, “cat”' in out(4), out(4))
        # 7 power
        l = L(5); l.locator('.seg button', has_text='Ordinary').click(); ok(T+'power ordinary axes', 'ordinary axes' in out(5))
        setrange(l, 0, 240); ok(T+'power max N', '1T parameters' in out(5) and '16% lower' in out(5), out(5))
        # 8 budget
        l = L(6); l.locator('.seg button', has_text='Gopher').click(); ok(T+'budget gopher', '280B parameters' in out(6) and 'like Gopher' in out(6), out(6))
        l.locator('.seg button', has_text='Llama').click(); ok(T+'budget llama', '8B parameters' in out(6) and '15T tokens' in out(6), out(6))
        l.locator('.lab-reset').click(); ok(T+'budget reset exact', '70B parameters' in out(6) and '1.4T' in out(6), out(6))
        # 9 align
        l = L(7); l.locator('.seg button', has_text='Flawed').click(); setrange(l, 0, 0)
        ok(T+'align reward hacking', 'Reward hacking' in out(7), out(7))
        l.get_by_role('checkbox').check(); ok(T+'align never -> 0%', '0%' in out(7))
        l.get_by_role('checkbox').uncheck(); l.locator('.seg button', has_text='Learn from').click()
        ok(T+'align mine prompt', 'Make a few choices' in out(7))
        for _ in range(4): l.locator('.pair-opt').nth(0).click()
        ok(T+'align learned rewards', 'Learned rewards' in out(7), out(7))
        l.locator('.lab-reset').click(); ok(T+'align reset', l.locator('.pair-box').is_hidden())
        # 10, 11 quizzes
        L(8).locator('.quiz-opt').nth(1).click(); ok(T+'quiz ch6', out(8).startswith('Correct.'))
        L(9).locator('.quiz-opt').nth(2).click(); ok(T+'quiz ch7', out(9).startswith('Correct.'))
        # 12 moe
        l = L(10); setrange(l, 0, 4); ok(T+'moe k=4', 'goes to 4 of 8' in out(10) and '50%' in out(10), out(10))
        l.get_by_role('button', name='Next word').click(); ok(T+'moe next word', '“weights”' in out(10))
        l.get_by_role('button', name='Play the sentence').click(); pg.wait_for_timeout(100 if motion == 'reduce' else 8000)
        ok(T+'moe play to end', 'busiest expert' in out(10), out(10))
        setrange(l, 0, 8); ok(T+'moe dense', 'ordinary dense layer' in out(10))
        # 13 fit
        l = L(11); vis = lambda: [c.is_visible() for c in l.locator('.lab-controls > .lab-controls').all()]
        ok(T+'fit only weights panel visible', vis() == [True, False, False], vis())
        l.locator('.seg button', has_text='4-bit').click(); ok(T+'fit 70B 4bit 35GB fits 48', '35 GB' in out(11) and '48 GB GPU' in out(11), out(11))
        l.locator('.seg button', has_text='65B').click(); ok(T+'fit 65B 4bit 32.5', '32.5 GB' in out(11) or '33 GB' in out(11), out(11))
        l.locator('.seg button', has_text='Fine-tuning').click(); ok(T+'fit lora panel', vis() == [False, True, False] and '65,536' in out(11) and '0.39%' in out(11), out(11))
        l.locator('.seg button', has_text='Context cache').click(); setrange(l, 1, 15)
        ok(T+'fit cache 32k = 17.2GB', '32,768 tokens' in out(11) and '17.2 GB' in out(11), out(11))
        l.locator('.seg button', has_text='1, multi').click(); ok(T+'fit mqa 0.5GB', '0.5 GB' in out(11), out(11))
        l.locator('.lab-reset').click(); ok(T+'fit reset', vis() == [True, False, False] and '140 GB' in out(11))
        # 14 rag
        l = L(12)
        ok(T+'rag initial transformer top', 'Transformer, 2017' in l.locator('.rr-name').first.inner_text())
        l.locator('.sug').nth(3).click(); ok(T+'rag weak match', 'weak' in out(12), out(12))
        l.locator('.sug').nth(1).click(); ok(T+'rag lora', 'LoRA' in l.locator('.rag-res').inner_text())
        l.locator('input[type=search]').fill(''); l.get_by_role('button', name='Search').click(); ok(T+'rag empty', 'Type a question' in out(12))
        l.locator('input[type=search]').fill('how the'); l.get_by_role('button', name='Search').click(); ok(T+'rag stopwords', 'very common words' in out(12))
        l.locator('input[type=search]').fill('xylophone zebra'); l.locator('input[type=search]').press('Enter'); ok(T+'rag no match', 'No milestone' in out(12))
        l.locator('.sug').nth(0).click(); l.locator('.rr-name').first.click(); pg.wait_for_timeout(150)
        ok(T+'rag opens study card', pg.locator('#sheet').evaluate('d => d.open') and 'Transformer' in pg.locator('#sheet-title').inner_text())
        pg.keyboard.press('Escape'); pg.wait_for_timeout(150)
        ok(T+'card closes, focus returns', not pg.locator('#sheet').evaluate('d => d.open') and pg.evaluate("document.activeElement.classList.contains('rr-name')"))
        # 15 patches
        l = L(13); l.locator('.seg button', has_text='8').first.click(); ok(T+'patches 8px', '784 tokens' in out(13), out(13))
        l.locator('.seg button', has_text='16').click(); cv = l.locator('canvas.patch-cv'); cv.focus(); pg.keyboard.press('ArrowRight'); pg.keyboard.press('ArrowDown')
        ok(T+'patches keyboard', 'Row 8, column 6' in l.locator('.patch-info').inner_text(), l.locator('.patch-info').inner_text())
        box = cv.bounding_box(); cv.click(position={'x': 2, 'y': 2}); ok(T+'patches click', 'Row 1, column 1' in l.locator('.patch-info').inner_text())
        # 16 vote
        l = L(14); l.locator('.seg button', has_text='1').first.click(); setrange(l, 0, .3)
        ok(T+'vote hurts', 'Voting hurts' in out(14), out(14))
        l.get_by_role('button', name='Run one question').click(); ok(T+'vote one question', 'One question' in out(14))
        l.locator('.lab-reset').click(); ok(T+'vote reset', 'Voting helps' in out(14))
        # 17 grpo
        l = L(15); l.get_by_role('button', name='Make all right').click(); ok(T+'grpo no signal', 'spread is 0' in out(15))
        l.get_by_role('button', name='Make one right').click(); ok(T+'grpo one right +2.65', '+2.65' in out(15), out(15))
        l.locator('.grpo-col').nth(0).click(); ok(T+'grpo toggle', '2 of 8 right' in out(15), out(15))
        # 18 react
        l = L(16); l.get_by_role('button', name='Run all').click(); pg.wait_for_timeout(100 if motion == 'reduce' else 6500)
        ok(T+'react run all', 'Done' in out(16) and l.locator('.rs').count() == 9, out(16))
        ans = l.locator('.rs-answer').inner_text(); ok(T+'react real months 15', '15 months' in ans, ans)
        l.locator('.seg button', has_text='LoRA and QLoRA').click()
        for _ in range(9): l.get_by_role('button', name='Next step').click()
        ans = l.locator('.rs-answer').inner_text(); ok(T+'react lora->qlora 23 months', '23 months' in ans, ans)
        l.locator('.seg button', has_text='Answer from memory').click(); l.get_by_role('button', name='Next step').click(); ok(T+'react memory', 'No tools' in out(16))
        # chapter 14 layers accordion (was the anatomy experiment)
        lay = pg.locator('.layers'); b0 = lay.locator('.layer-b').nth(7); b0.click()
        ok(T+'layers expand', b0.get_attribute('aria-expanded') == 'true' and lay.locator('.layer-p').nth(7).is_visible())
        lay.locator('.layer-p').nth(7).locator('.layer-ids button').first.click(); pg.wait_for_timeout(150)
        ok(T+'layers open card', pg.locator('#sheet').evaluate('d => d.open'))
        pg.keyboard.press('Escape'); pg.wait_for_timeout(100)
        ok(T+'layers milestones count', lay.locator('.layer-ids button').count() == 32, lay.locator('.layer-ids button').count())
        b0.click(); ok(T+'layers collapse', b0.get_attribute('aria-expanded') == 'false' and lay.locator('.layer-p').nth(7).is_hidden())
        # accessibility audit inside labs
        audit = pg.evaluate('''() => {
          const bad = [], small = [];
          document.querySelectorAll('.lab button, .lab input, .lab select, .lab canvas[tabindex], .lab summary').forEach(e => {
            if (e.offsetParent === null) return;
            const name = (e.getAttribute('aria-label') || e.textContent || (e.labels && e.labels[0] && e.labels[0].textContent) || '').trim();
            if (!name) bad.push(e.outerHTML.slice(0, 80));
            const r = e.getBoundingClientRect(); if (e.type !== 'checkbox' && (r.height < 32 || r.width < 24)) small.push(e.tagName + ':' + (e.textContent || e.type).trim().slice(0, 20) + ' ' + Math.round(r.width) + 'x' + Math.round(r.height));
          });
          const ranges = [...document.querySelectorAll('.lab input[type=range]')].filter(i => !i.getAttribute('aria-valuetext')).length;
          return {unnamed: bad, small: small.slice(0, 20), rangesNoText: ranges};
        }''')
        ok(T+'all lab controls named', not audit['unnamed'], audit['unnamed'])
        ok(T+'ranges have valuetext', audit['rangesNoText'] == 0)
        ok(T+'touch targets >=32px', not audit['small'], audit['small'])
        ok(T+'no page errors', not errs, errs)
        sw = pg.evaluate('document.documentElement.scrollWidth'); ok(T+'no horizontal overflow after interactions', sw <= vw, sw)
        ctx.close()
    b.close()
fails = [r for r in results if not r[1]]
for r in results: print(('PASS ' if r[1] else 'FAIL ') + r[0] + ('' if r[1] else '  -> ' + str(r[2])[:300]))
print(f'\n{len(results) - len(fails)}/{len(results)} passed')
sys.exit(1 if fails else 0)  # a failed check must fail the run, so the automatic checks on a pull request see it
