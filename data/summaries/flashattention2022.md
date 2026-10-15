---
milestone: flashattention2022
source: https://arxiv.org/abs/2205.14135v2
version: arXiv version 2 (June 2022); the paper was later published at NeurIPS 2022
read: 2026-10-15
reviewed_by: Zeeshan Arif
---
## What it changed

It made exact Transformer attention several times faster and much lighter on memory, not by doing less arithmetic but by reading and writing the GPU's slow memory far less often.

## The problem before it

[Self-attention](/glossary/attention/) compares every token with every other token, so its time and memory grow with the square of the sequence length. Long inputs were slow and quickly ran out of memory.

Many methods tried to fix this by computing attention only approximately, for example with [sparse attention](/glossary/sparse-attention/) such as [BigBird](/milestones/bigbird2020/), or with low-rank shortcuts. They cut the number of arithmetic operations, but the authors point out that many of them were not actually faster in wall-clock time, and few were widely used.

The authors' diagnosis: on modern GPUs, arithmetic has become much faster than memory. A GPU has a small, very fast on-chip memory (SRAM, about 20 MB in total on an A100) and a large, slower main memory (HBM, 40 to 80 GB). Standard attention writes the full `N × N` table of attention scores to HBM, reads it back for the softmax, writes it again, and reads it again. Most of the time goes into this traffic, not into the arithmetic. The usual programming tools, such as PyTorch, give no fine control over which memory is used.

## The idea

**The mechanism.** FlashAttention computes exactly the same result as standard attention, but never stores the full `N × N` table in HBM. It is "IO-aware": it is designed around the cost of moving data between the two kinds of memory. It uses two known techniques:

- **Tiling.** Split the queries, keys and values into blocks small enough to fit in SRAM. Load one block of keys and values, then go through the blocks of queries, computing their part of the attention output on chip. The difficulty is the softmax, which normally needs a whole row of scores at once. The fix is to keep two running numbers per row, the largest score so far and the running sum. When a new block arrives, earlier partial results are rescaled with these numbers, so the final output is exact.
- **Recomputation.** Training needs the attention table again for the backward pass. Instead of storing it, FlashAttention keeps only the output and the two numbers per row, and recomputes the table block by block in SRAM. This adds arithmetic, but it is still faster, because reading the stored table from HBM would take longer.

All the steps (matrix multiply, mask, softmax, dropout, matrix multiply) run in one GPU program, a single "kernel", written in CUDA. Memory use grows only linearly with sequence length.

The paper also gives **block-sparse FlashAttention**: the same method, but skipping blocks that a fixed sparsity pattern marks as empty. This is an approximate method, and faster again.

**The notation.** Standard attention computes `S = QKᵀ`, `P = softmax(S)`, `O = PV`, where `Q`, `K` and `V` have `N` rows (the sequence length) and `d` columns (the head size). The paper proves that standard attention needs `Θ(Nd + N²)` accesses to HBM, while FlashAttention needs `Θ(N²d²/M)`, where `M` is the size of SRAM. With typical `d` of 64 to 128 and `M` of about 100 KB, `d²` is many times smaller than `M`. The paper also proves that no exact attention method can do asymptotically better for all SRAM sizes.

## What it showed

**Reported in the paper.** We read version 2 of the arXiv paper, a preprint. The paper was later published at NeurIPS 2022. Training times are on 8 A100 GPUs unless stated.

- **Memory traffic.** For one GPT-2 medium attention layer, FlashAttention did slightly more arithmetic (75.2 against 66.6 GFLOPs) but moved far less data to and from HBM (4.4 GB against 40.3 GB). Its runtime was 7.3 ms against 41.7 ms.
- **BERT-large.** Training to the target accuracy took 17.4 minutes, against 20.0 minutes for Nvidia's record in the MLPerf 1.1 benchmark, 15% faster.
- **GPT-2.** Training reached the same perplexity in less time. GPT-2 small took 2.7 days, against 9.5 days with Hugging Face's code and 4.7 days with Megatron-LM. GPT-2 medium took 6.9 days, against 21.0 and 11.5.
- **The paper gives two sizes for the GPT-2 speedups.** The abstract and introduction say "up to 3×" against Hugging Face, and Table 2 gives 3.5× for GPT-2 small. Against Megatron-LM, the text says 1.7× and the summary at the start of section 4 says 1.8×. All are given here.
- **Long Range Arena** (a set of tasks with sequences of 1,024 to 4,096 tokens). FlashAttention was 2.4× faster than standard attention, with the same or slightly better accuracy. Block-sparse FlashAttention was 2.8× faster, faster than every approximate method tested.
- **Longer context, better models.** GPT-2 small with 4 times the context (4K tokens) still trained 30% faster than Megatron-LM with 1K, and reached a perplexity 0.7 better (17.5 against 18.2). On two long-document classification tasks, longer inputs raised scores by 4.3 and 8.5 points.
- **New capabilities.** Path-X asks whether two points in an image are connected, with the image given one pixel at a time (16K tokens). Earlier Transformers ran out of memory or scored at chance. FlashAttention scored 61.4%. Block-sparse FlashAttention scored 63.1% on Path-256 (64K tokens).
- **Speed and memory by length.** Up to 3× faster than PyTorch's standard attention for sequences of 128 to 2K tokens, and up to 20× less memory. Some approximate methods became faster beyond 512 to 1,024 tokens. Block-sparse FlashAttention was faster than all of them at every length.

## Limits, and what came later

The limits come from the paper:

- Each new kind of attention needs a new CUDA kernel, written in a much lower-level language than PyTorch, with significant engineering effort.
- Kernels may not carry over from one GPU architecture to another.
- The analysis covers one GPU. Splitting attention across several GPUs adds another level of data movement that the paper does not handle.
- Beyond about 1,024 tokens, some approximate methods are faster than exact FlashAttention.

Later work built on it directly. [FlashAttention-3](/milestones/flashattention3_2024/) is a later version of the same kernel. [Mistral 7B](/milestones/mistral7b2023/) used FlashAttention for efficient attention. [Mamba](/milestones/mamba2023/) took up its hardware-aware design.

## What to know first

- [Attention](/glossary/attention/) in the [Transformer](/milestones/transformer2017/), and what the softmax does.
- [Multi-head attention](/glossary/multi-head-attention/) and the head size `d`.
- That a GPU has a small fast memory and a large slow one, and that an operation can be limited by memory traffic rather than by arithmetic.
- Why the backward pass in training needs values saved from the forward pass.

## How to read it

The main text is 10 pages, followed by references, proofs and full results.

1. Read section 1 with Figure 1. The left side shows the two memories and the loops.
2. Read section 2 for the GPU background and standard attention.
3. Read section 3.1 and Algorithm 1. The softmax rescaling is the key step.
4. Look at Figure 2 (left), then read section 4 with Tables 1 to 4.
5. Read section 5 for the authors' own limits.

Skip the proofs in Appendix C on a first reading. Expect about 1.5 hours for the parts above (an estimate).

## Links

- The paper: [arXiv 2205.14135](https://arxiv.org/abs/2205.14135)
- Code: [flash-attention](https://github.com/Dao-AILab/flash-attention). The paper names it at github.com/HazyResearch/flash-attention, which now leads to this address.
- Video: none is linked here yet.
