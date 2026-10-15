# Launch checklist

Phase 7 of [the plan](PLAN.md): check the site in Safari and on a real phone, then make it public.

## What the automated checks already cover

Every pull request runs the full test suite twice: in Chromium (the engine behind Chrome and Edge) and in WebKit (the engine behind Safari). Both runs cover:

- every page at a phone width (390 pixels) and a desktop width (1440 pixels), in light and dark themes;
- no sideways scrolling, text contrast to WCAG AA, and no script errors;
- search, the filters on the milestones list, "before and after" on milestone pages, and the links into the guided tour;
- the guided tour's scenes, scrolling, resizing, reduced motion and keyboard use.

WebKit in these tests is not the same as Safari on an iPhone. Touch scrolling, the address bar that grows and shrinks, the real fonts on the device, and Safari's own settings can still differ. So a short check by hand comes before launch.

## The check by hand

Use the preview address of the launch pull request, or the current site at https://nlp-lineage.vercel.app/.

On an iPhone in Safari (and, if you have one, an Android phone in Chrome):

1. **Home page.** It loads, the text is easy to read, and nothing runs off the right edge.
2. **Menu.** Every item in the menu can be tapped, including on the second row.
3. **Milestones list.** Open the filters, choose a thread and a year, and check that the list changes. Turn the phone sideways and back.
4. **A milestone page,** for example the Transformer. The summary reads well. In "Before and after", switching the options (weak links, short or full list) changes the list.
5. **Search.** Search for "attention" and open a result.
6. **Glossary and learning path.** Open a term, and on the learning path open "The other milestones in this phase".
7. **Guided tour.** Scroll through at least three chapters. The diagrams move with the scroll and do not jump or flicker. Rotate the phone once while in the tour.
8. **Dark mode.** Switch the phone to dark mode and look at the home page and a milestone page.
9. **Report a problem.** Tap it at the bottom of a page. It opens GitHub with the page's address filled in. You do not need to send the issue.

On a Mac in Safari, if you have one:

10. With **Settings > Advanced > Press Tab to highlight each item** switched on, press Tab once on the guided tour. The first thing to get focus is "Skip to the content".

Note anything that looks wrong, with the page and the device. Each problem gets fixed in its own pull request before launch.

## Making the site public

The launch is one pull request. When it is merged and deployed:

- the "Preview. This site is unfinished and not yet public." line goes from every page;
- the instruction to search engines not to index the site goes, both from the pages and from `vercel.json`;
- a `robots.txt` and a sitemap tell search engines which pages exist;
- the about page and the README no longer call the site a preview.

Undoing the launch is possible (revert the pull request), but search engines may already have seen the pages by then.
