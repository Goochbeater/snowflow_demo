# Moonwick — source parts

`../moonwick.html` is the game: one self-contained file (three.js r160 embedded), no network needed.

It is generated from the numbered parts in this folder:

```bash
./rebuild.sh build/main.html
```

```bash
python3 tools/offline.py build/main.html ../moonwick.html
```

Parts `00`–`09`, `88`, `97`–`99` are the voxel + destruction engine; everything else is the game
(`05` plan, `10` terrain, `20` village, `25` tower, `30`/`32` nature + forest, `50`/`52` villagers,
`55`/`57` animals, `60` sky, `70` fairy + spells, `75` story, `77` secrets + bosses, `80` UI, `85` audio).
