"""Progress of `hyperframes render --quiet` (which prints nothing): counts the frames already encoded in the partial
MP4 of the render's work folder. That file has no moov yet, so it walks the mdat (AVCC NALs with 4-byte lengths).

Usage: python3 toolkit/render/progress.py <project>
"""
import glob, re, struct, sys
from pathlib import Path

project = Path(sys.argv[1]).resolve()
out = project / 'build' / 'out'
found = glob.glob(str(out / 'work-*' / 'video-only.mp4'))
if not found:
    sys.exit('no render in progress (no build/out/work-*/video-only.mp4)')
d = Path(found[0]).read_bytes()
p = 0
while p + 8 <= len(d):
    size, kind = struct.unpack('>I4s', d[p:p + 8])
    if kind == b'mdat':
        p += 16 if size == 1 else 8
        break
    p += size
n = 0
while p + 4 <= len(d):
    size = struct.unpack('>I', d[p:p + 4])[0]
    if size == 0 or p + 4 + size > len(d):
        break
    if d[p + 4] & 0x1f in (1, 5):
        n += 1
    p += 4 + size
html = (project / 'build' / 'composition' / 'index.html').read_text()
total = float(re.search(r'data-composition-id="main"[^>]*data-duration="([\d.]+)"', html).group(1)) * 30
print(f'{n} of {int(total)} frames ({100 * n / total:.0f}%)')
