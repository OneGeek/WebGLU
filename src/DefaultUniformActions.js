/** @ignore Wrapper function to allow multifile or single file organization */
$W.initDefaultUniformActions = function() {
    $W.uniformActions = [];
    $W.uniformNames = {};
    $W.uniformNames.ModelView       = 'ModelViewMatrix';
    $W.uniformNames.Projection      = 'ProjectionMatrix';
    $W.uniformNames.NormalMatrix    = 'NormalMatrix';
    $W.uniformNames.SimpleTexture   = 'sampler';
    $W.uniformNames.MaterialTexture = 'wglu_mat_texture';
    ModelViewAction = 
        function DUA_ModelViewAction(_, object, material) {
            $W.GL.uniformMatrix4fv(this.location, false, 
                    $W.modelview.getForUniform());
        };

    ProjectionAction = 
        function DUA_ProjectionAction(_, object, material) {
            $W.GL.uniformMatrix4fv(this.location, false, 
                    $W.projection.getForUniform());
        };

    NormalMatrixAction = 
        function DUA_NormalMatrixAction(_, object, material){
            $W.GL.uniformMatrix3fv(this.location, false, 
                    $W.util.getNormalMatrixForUniform());
        };

    SimpleSamplerAction = 
        function DUA_SimpleSamplerAction(_, object, material) {
            try {
                var gl = $W.GL;
                gl.activeTexture(gl.TEXTURE0);
                $W.textures[object.textures[0]].bind();
                gl.uniform1i(this.location, 0);
            }catch (e) {
                console.error("Simple texture uniform error");
                console.error(e);
            }
        };

    MaterialTextureAction = 
        function DUA_MaterialTextureAction(_, object, material) {
            try {
                $W.GL.activeTexture($W.GL.TEXTURE0);
                if (typeof(material.textures[0]) === 'undefined') {
                    $W.textures.wglu_internal_missing_texture.bind();
                }else {
                    $W.textures[material.textures[0]].bind();
                }
                $W.GL.uniform1i(this.location, 0);
            }catch (e) {
                console.error("Material texture uniform error");
                console.error(e);
            }
        };

    genMultiTextureAction = function DUA_genMultiTextureAction(texNum) {
        eval("var action = \n"+
"        function DUA_MultiTextureAction"+texNum+"(_ , object, material) {\n"+
"           try {\n"+
"               $W.GL.activeTexture($W.GL.TEXTURE0);\n"+
"               if (typeof(material.textures["+texNum+"]) === 'undefined') {\n"+
"                   $W.textures.wglu_internal_missing_texture.bind();\n"+
"               }else {\n"+
"                   $W.textures[material.textures["+texNum+"]].bind();\n"+
"               }\n"+
"               $W.GL.uniform1i(this.location, "+texNum+");\n"+
"           }catch (e) {\n"+
"               console.error('Material texture uniform error');\n"+
"               console.error(e);\n"+
"           }\n"+
"        }");
        return action;
    };
            


    $W.uniformActions[$W.constants.ModelViewUniform]  = ModelViewAction;
    $W.uniformActions[$W.constants.ProjectionUniform] = ProjectionAction;
    $W.uniformActions[$W.constants.NormalUniform]     = NormalMatrixAction;
    $W.uniformActions[$W.constants.SimpleTextureUniform] = SimpleSamplerAction;

    $W.util.getUniformAction = function(name) {
        var action = $W.uniformActions[name];

        if (typeof(action) === 'undefined') {
            action = function(){};
            $W.debug("\tno default action for uniform `" + name + "` found");
                

        }else {
            $W.debug("\tfound `" + action.name + "` for uniform `" + name + "`");
        }

        return action;
    };
};

