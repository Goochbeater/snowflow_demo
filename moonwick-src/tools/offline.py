#!/usr/bin/env python3
# Make the built html self-contained: embed three.js r160 + the addons it needs, served to the module loader through blob URLs
# and a dynamically inserted import map (no network needed).  usage: offline.py in.html out.html
import sys, os, re, json
src, dst = sys.argv[1], sys.argv[2]
V = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'vendor')
files = {
  'three': 'build/three.module.js',
  'three/addons/postprocessing/Pass.js': 'examples/jsm/postprocessing/Pass.js',
  'three/addons/postprocessing/MaskPass.js': 'examples/jsm/postprocessing/MaskPass.js',
  'three/addons/shaders/CopyShader.js': 'examples/jsm/shaders/CopyShader.js',
  'three/addons/shaders/LuminosityHighPassShader.js': 'examples/jsm/shaders/LuminosityHighPassShader.js',
  'three/addons/shaders/OutputShader.js': 'examples/jsm/shaders/OutputShader.js',
  'three/addons/postprocessing/ShaderPass.js': 'examples/jsm/postprocessing/ShaderPass.js',
  'three/addons/postprocessing/EffectComposer.js': 'examples/jsm/postprocessing/EffectComposer.js',
  'three/addons/postprocessing/RenderPass.js': 'examples/jsm/postprocessing/RenderPass.js',
  'three/addons/postprocessing/UnrealBloomPass.js': 'examples/jsm/postprocessing/UnrealBloomPass.js',
  'three/addons/postprocessing/OutputPass.js': 'examples/jsm/postprocessing/OutputPass.js',
  'three/addons/utils/BufferGeometryUtils.js': 'examples/jsm/utils/BufferGeometryUtils.js',
}
html = open(src, encoding='utf-8').read()
blocks = []
for i, (spec, rel) in enumerate(files.items()):
    t = open(os.path.join(V, rel), encoding='utf-8').read()
    t = re.sub(r"from '\./([A-Za-z]+\.js)'", r"from 'three/addons/postprocessing/\1'", t)
    t = re.sub(r"from '\.\./shaders/([A-Za-z]+\.js)'", r"from 'three/addons/shaders/\1'", t)
    assert "from './" not in t and "from '../" not in t, rel
    t = t.replace('</script', '<\\/script')
    blocks.append('<script type="text/plain" class="vend" data-spec="%s">%s</script>' % (spec, t))
boot = '''<script>
(function(){var m={},n=document.querySelectorAll('script.vend');for(var i=0;i<n.length;i++){m[n[i].getAttribute('data-spec')]=URL.createObjectURL(new Blob([n[i].textContent],{type:'text/javascript'}));}
var s=document.createElement('script');s.type='importmap';s.textContent=JSON.stringify({imports:m});document.head.appendChild(s);})();
</script>'''
a = html.index('<script type="importmap">'); b = html.index('</script>', a) + len('</script>')
html = html[:a] + '\n'.join(blocks) + '\n' + boot + html[b:]
open(dst, 'w', encoding='utf-8').write(html)
print('offline build', dst, len(html), 'bytes')
