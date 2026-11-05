"""Check a recording against its narration: extract, from each recorded scene, the frame at the end of each phrase
and tile them in 2x3 grids.

The frame is taken 0.25 s before the next phrase starts, with the phrase's action already done. Compare each frame
with the phrase text (in the order of the scene's narration block).

Usage: python3 toolkit/capture/frames.py <project> [scene ...] [--mid]
  --mid  also extracts frames at 45%, 70% and 85% of each phrase (for actions undone before the end, like a filter
         applied and then cleared)
Output: <project>/build/frames/<scene>_NN.jpg and <project>/build/frames/grid/<scene>_N.jpg
"""
import json, subprocess, sys
from pathlib import Path

args = [a for a in sys.argv[1:] if not a.startswith('--')]
project, wanted = Path(args[0]).resolve(), args[1:]
mid = '--mid' in sys.argv
build = project / 'build'
out = build / 'frames'
(out / 'grid').mkdir(parents=True, exist_ok=True)
timings = json.loads((build / 'timings.json').read_text())


def frame(scene: str, t: float, name: str) -> None:
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-ss', f'{t:.2f}', '-i', str(build / 'clips' / f'{scene}.webm'),
                    '-frames:v', '1', '-vf', 'scale=800:-1', str(out / name)], check=True)


for scene, d in timings.items():
    meta = build / 'clips' / f'{scene}.json'
    if not meta.exists() or (wanted and scene not in wanted):
        continue
    start = json.loads(meta.read_text())['start']
    ph = d['phrases']
    for i, f in enumerate(ph):
        end = ph[i + 1]['start'] if i + 1 < len(ph) else d['duration']
        frame(scene, start + end - 0.25, f'{scene}_{i + 1:02d}.jpg')
        if mid:
            for k, p in enumerate((0.45, 0.7, 0.85)):
                frame(scene, start + f['start'] + (end - f['start']) * p, f'{scene}_{i + 1:02d}_m{k}.jpg')
    # ffmpeg's glob supports ? and *, not [0-9].
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-pattern_type', 'glob', '-i', str(out / f'{scene}_??.jpg'),
                    '-vf', 'tile=2x3:padding=6:color=white', str(out / 'grid' / f'{scene}_%d.jpg')], check=True)
    print(scene, len(ph), 'phrases')
    for i, f in enumerate(ph):
        print(f'  {i + 1:02d}  {f["text"]}')
