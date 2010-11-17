// Read a page's GET URL variables and return them as an associative array.
function getUrlVars()
{
    var vars = [], hash;
    var hashes = window.location.href.slice(window.location.href.indexOf('?') + 1).split('&');
    for(var i = 0; i < hashes.length; i++)
    {
        hash = hashes[i].split('=');
        vars.push(hash[0]);
        vars[hash[0]] = hash[1];
    }
    return vars;
}

function getRenderType() {
    if (getUrlVars()['wireframe'] == 1) {
        return $W.GL.LINE_LOOP;
    }else{
        return $W.GL.TRIANGLES;
    }
}

function getVideoPath() {
    var vars = getUrlVars();
    var path = '';
    if (typeof(vars['video']) == 'undefined') {
        path = 'new_york.ogv';
    }else {
        path = vars['video'];
    }
    return path;
}
