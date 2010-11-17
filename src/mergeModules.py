

import os

mergedFilePath = os.path.join(os.getcwd(), "webglu.complete.js")
modules = [ 'webglu', 'crazyglu', 'gameglu', 'Util', 'Constants',
            'DefaultUniformActions', 'GLSL', 'GLU', 'Animation', 'Object',
            'Texture', 'Framebuffer', 'Material', 'Renderer', 'ControlProfiles'
            ];

if (os.path.isfile(mergedFilePath)):
    os.remove(mergedFilePath)
modules = [os.path.join(os.getcwd(), module + '.js') for module in modules]
os.mknod(mergedFilePath)
with open(mergedFilePath, 'w') as mergedFile:
    for module in modules:
        with open(module) as moduleFile:
            print module
            for line in moduleFile:
                mergedFile.write(line)
