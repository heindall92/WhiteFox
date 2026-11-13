"""Uso: python3 hero/inject.py hero/hero-v2.png  -> optimiza a WebP 1280px y la incrusta en index.html (data: URI, sin peticiones externas)."""
import sys,base64,io
from PIL import Image
im=Image.open(sys.argv[1]).convert('RGB')
if im.width>1280: im=im.resize((1280,round(im.height*1280/im.width)),Image.LANCZOS)
b=io.BytesIO(); im.save(b,'WEBP',quality=72,method=6)
print('webp bytes',b.tell(),im.size)
s=open('index.html').read(); assert '__HERO_IMG__' in s
s=s.replace('__HERO_IMG__','data:image/webp;base64,'+base64.b64encode(b.getvalue()).decode())
open('index.html','w').write(s)
