$W.uniformActions = [];
$W.uniformNames = {};
$W.uniformNames.ModelView       = 'ModelViewMatrix';
$W.uniformNames.Projection      = 'ProjectionMatrix';
$W.uniformNames.NormalMatrix    = 'NormalMatrix';
$W.uniformNames.SimpleTexture   = 'sampler';
$W.uniformNames.MaterialTexture = 'wglu_mat_texture';


$W.setupUniformActions = function() {
    ModelViewAction = 
        function DUA_ModelViewAction(uniform, object, material) {
            $W.GL.uniformMatrix4fv(uniform.location, false, 
                    $W.modelview.getForUniform());
        };

    ProjectionAction = 
        function DUA_ProjectionAction(uniform, object, material) {
            $W.GL.uniformMatrix4fv(uniform.location, false, 
                    $W.projection.getForUniform());
        };

    NormalMatrixAction = 
        function DUA_NormalMatrixAction(uniform, object, material){
            $W.GL.uniformMatrix3fv(uniform.location, false, 
                    $W.util.getNormalMatrixForUniform());
        };

    SimpleSamplerAction = 
        function DUA_SimpleSamplerAction(uniform, object, material) {
            try {
                var gl = $W.GL;
                gl.activeTexture(gl.TEXTURE0);
                $W.textures[object.textures[0]].bind();
                gl.uniform1i(uniform.location, 0);
            }catch (e) {
                console.error("Simple texture uniform error");
                console.error(e);
            }
        };

    MaterialTextureAction = 
        function DUA_MaterialTextureAction(uniform, object, material) {
            try {
                $W.GL.activeTexture($W.GL.TEXTURE0);
                if (typeof(material.textures[0]) === 'undefined') {
                    $W.textures.wglu_internal_missing_texture.bind();
                }else {
                    $W.textures[material.textures[0]].bind();
                }
                $W.GL.uniform1i(uniform.location, 0);
            }catch (e) {
                console.error("Material texture uniform error");
                console.error(e);
            }
        };


    $W.uniformActions = [];
    $W.uniformActions[$W.constants.ModelViewUniform]  = ModelViewAction;
    $W.uniformActions[$W.constants.ProjectionUniform] = ProjectionAction;
    $W.uniformActions[$W.constants.NormalUniform]     = NormalMatrixAction;
    $W.uniformActions[$W.constants.SimpleTextureUniform] = SimpleSamplerAction;
};

$W.util.getUniformAction = function(name) {
    var action = $W.uniformActions[name];

    if (typeof(action) === 'undefined') {
        action = function(){};
        console.log(
            "no default action for uniform `" + name + "` found");
            

    }else {
        console.log( 
            "found `" + action.name + "` for uniform `" + name + "`");
    }

    return action;
};

$W.setupUniformActions();
