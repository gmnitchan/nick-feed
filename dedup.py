#!/usr/bin/env python3
"""
Semantic dedup for nick-feed cards.

Usage:
  python3 dedup.py build          — rebuild embedding index from cards.json
  python3 dedup.py check FILE     — check new cards in FILE against index, output clean cards
  python3 dedup.py check FILE -v  — verbose: show what was rejected and why
"""

import json
import sys
import os
import numpy as np

MODEL_DIR = os.path.expanduser("~/.cache/nick-feed-embeddings")
INDEX_FILE = "dedup-index.npz"
SIMILARITY_THRESHOLD = 0.75

_session = None
_tokenizer = None

def get_model():
    global _session, _tokenizer
    if _session is None:
        import onnxruntime as ort
        from tokenizers import Tokenizer
        _tokenizer = Tokenizer.from_file(os.path.join(MODEL_DIR, "tokenizer.json"))
        _tokenizer.enable_padding(length=128)
        _tokenizer.enable_truncation(max_length=128)
        _session = ort.InferenceSession(os.path.join(MODEL_DIR, "onnx/model.onnx"))
    return _session, _tokenizer


def embed(texts):
    session, tokenizer = get_model()
    encoded = tokenizer.encode_batch(texts)
    input_ids = np.array([e.ids for e in encoded], dtype=np.int64)
    attention_mask = np.array([e.attention_mask for e in encoded], dtype=np.int64)
    token_type_ids = np.zeros_like(input_ids)
    outputs = session.run(None, {
        "input_ids": input_ids,
        "attention_mask": attention_mask,
        "token_type_ids": token_type_ids,
    })
    token_embeddings = outputs[0]
    mask_expanded = attention_mask[:, :, np.newaxis].astype(np.float32)
    summed = np.sum(token_embeddings * mask_expanded, axis=1)
    counts = np.clip(mask_expanded.sum(axis=1), 1e-9, None)
    embeddings = summed / counts
    norms = np.linalg.norm(embeddings, axis=1, keepdims=True)
    return embeddings / norms


def card_text(card):
    """Extract the text to embed from a card — title + first sentence of body."""
    title = card.get("title", "")
    body = card.get("body", "")
    first_sentence = body.split(".")[0] if body else ""
    return f"{title}. {first_sentence}"


def build_index():
    with open("cards.json") as f:
        cards = json.load(f)

    texts = [card_text(c) for c in cards]
    ids = [c["id"] for c in cards]

    print(f"Embedding {len(cards)} cards...")
    # Batch in chunks of 64
    all_embeddings = []
    for i in range(0, len(texts), 64):
        batch = texts[i:i+64]
        all_embeddings.append(embed(batch))
    embeddings = np.vstack(all_embeddings)

    np.savez(INDEX_FILE, embeddings=embeddings, ids=np.array(ids))
    print(f"Index saved: {INDEX_FILE} ({len(ids)} cards, {embeddings.shape[1]}d)")


def check_cards(filepath, verbose=False):
    if not os.path.exists(INDEX_FILE):
        print("No index found. Run 'python3 dedup.py build' first.")
        sys.exit(1)

    data = np.load(INDEX_FILE, allow_pickle=True)
    existing_embeddings = data["embeddings"]
    existing_ids = list(data["ids"])

    with open(filepath) as f:
        new_cards = json.load(f)

    new_texts = [card_text(c) for c in new_cards]
    new_embeddings = embed(new_texts)

    # Cosine similarity: new_embeddings @ existing_embeddings.T
    similarities = new_embeddings @ existing_embeddings.T

    clean = []
    rejected = []
    for i, card in enumerate(new_cards):
        max_sim = similarities[i].max()
        max_idx = similarities[i].argmax()
        if max_sim >= SIMILARITY_THRESHOLD:
            rejected.append((card, float(max_sim), existing_ids[max_idx]))
        else:
            clean.append(card)

    if verbose:
        if rejected:
            print(f"\nRejected ({len(rejected)} cards):", file=sys.stderr)
            for card, sim, match_id in rejected:
                print(f"  {card['id']}: \"{card['title']}\" — {sim:.3f} similar to {match_id}", file=sys.stderr)
        print(f"\nPassed: {len(clean)} / {len(new_cards)} cards", file=sys.stderr)

    # Output clean cards to stdout as JSON
    print(json.dumps(clean, indent=2, ensure_ascii=False))
    return len(rejected)


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(__doc__)
        sys.exit(1)

    cmd = sys.argv[1]
    if cmd == "build":
        build_index()
    elif cmd == "check":
        if len(sys.argv) < 3:
            print("Usage: python3 dedup.py check FILE [-v]")
            sys.exit(1)
        verbose = "-v" in sys.argv
        check_cards(sys.argv[2], verbose=verbose)
    else:
        print(f"Unknown command: {cmd}")
        print(__doc__)
        sys.exit(1)
