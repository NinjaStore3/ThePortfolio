#!/usr/bin/env python3
"""Final assembly: fit each scene to its voice-over line, render, and mix voice + music.

    python3 assemble.py <dir with 01.mp3 … 09.mp3 and music.mp3>

Each scene lasts as long as its line plus a little air, but never less than the time its
animation needs. The music is ducked under the voice (sidechain compression) and faded out.
"""
import json, os, subprocess, sys

VD = os.path.dirname(os.path.abspath(__file__))
src = sys.argv[1]
MIN = [3.0, 3.6, 5.2, 3.6, 3.6, 5.2, 3.6, 3.6, 4.2]   # what each scene's animation needs
LEAD, TAIL = 0.25, 0.45                                # silence before / after each line

def dur(f):
    return float(subprocess.check_output(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', f]))

vo = [os.path.join(src, f'{i:02d}.mp3') for i in range(1, 10)]
lens = [dur(f) for f in vo]
scenes = [round(max(m, LEAD + l + TAIL), 2) for m, l in zip(MIN, lens)]
scenes[-1] = round(scenes[-1] + 1.2, 2)               # hold the end card a little longer
starts = [sum(scenes[:i]) for i in range(9)]
total = sum(scenes)
print('scenes', scenes, 'total', round(total, 2))

frames = os.path.join(VD, 'frames-final')
if not os.environ.get('AUDIO_ONLY'):
    subprocess.run(['rm', '-rf', frames], check=True)
    subprocess.run(['node', os.path.join(VD, 'render.mjs'), frames, '30'], check=True, env={**os.environ, 'DUR': json.dumps(scenes)})

# voice track: each line at the start of its scene (+ LEAD)
inputs, parts = [], []
for i, (f, s) in enumerate(zip(vo, starts)):
    inputs += ['-i', f]
    ms = int((s + LEAD) * 1000)
    parts.append(f'[{i}:a]aresample=48000,adelay={ms}|{ms}[v{i}]')
music = os.path.join(src, 'music.mp3')
inputs += ['-i', music]
m = len(vo)
fade_at = max(0, total - 1.8)
graph = ';'.join(parts) + ';' + ''.join(f'[v{i}]' for i in range(m)) + f'amix=inputs={m}:normalize=0,volume=1.0[voice];' \
    f'[voice]apad=whole_dur={total:.2f},asplit=2[vmix][vkey];' \
    f'[{m}:a]aresample=48000,atrim=0:{total:.2f},afade=t=in:d=0.6,afade=t=out:st={fade_at:.2f}:d=1.8,volume=0.55[mus];' \
    '[mus][vkey]sidechaincompress=threshold=0.03:ratio=6:attack=20:release=350[ducked];' \
    '[vmix][ducked]amix=inputs=2:normalize=0,alimiter=limit=0.95,loudnorm=I=-14:TP=-1.5:LRA=11[aout]'
audio = os.path.join(VD, 'mix.m4a')
subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', *inputs, '-filter_complex', graph, '-map', '[aout]',
                '-t', f'{total:.2f}', '-c:a', 'aac', '-b:a', '192k', audio], check=True)

if os.environ.get('AUDIO_ONLY'):
    print('wrote', audio, dur(audio)); sys.exit()
out = os.path.join(VD, 'istoselidakias-intro-9x16.mp4')
subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-framerate', '30', '-i', os.path.join(frames, '%05d.jpg'), '-i', audio,
                '-c:v', 'libx264', '-preset', 'slow', '-crf', '18', '-pix_fmt', 'yuv420p', '-c:a', 'copy', '-shortest',
                '-movflags', '+faststart', out], check=True)
print('wrote', out)
