
// There's obviously a better way, but this was quick and dirty
function stringToUrl(str) {
    str = str.replace(/%/g, "%25");
    str = str.replace(/\n/g, "%0A");
    str = str.replace(/ /g, "%20");
    str = str.replace(/=/g, "%3D");
    str = str.replace(/;/g, "%3B");
    str = str.replace(/{/g, "%7B");
    str = str.replace(/}/g, "%7D");
    str = str.replace(/</g, "%3C");
    str = str.replace(/>/g, "%3E");
    str = str.replace(/\|/g, "%7C");
    str = str.replace(/\[/g, "%5B");
    str = str.replace(/\]/g, "%5D");
    str = str.replace(/\"/g, "%22");
    str = str.replace(/\\\\/g, "%5C");
    str = str.replace(/&/g, "%36");
    str = str.replace(/\+/g, "%2B");
    str = str.replace(/,/g, "%2C");
    str = str.replace(/\//g, "%2F");
	return str
}

function urlToString(url) {
    url = url.replace(/%0A/g, "\n");
    url = url.replace(/%20/g, " ");
    url = url.replace(/%3D/g, "=");
    url = url.replace(/%3B/g, ";");
    url = url.replace(/%7B/g, "{");
    url = url.replace(/%7D/g, "}");
    url = url.replace(/%3C/g, "<");
    url = url.replace(/%3E/g, ">");
    url = url.replace(/%25/g, "%");
    url = url.replace(/%7C/g, "|");
    url = url.replace(/%5B/g, "[");
    url = url.replace(/%5D/g, "]");
    url = url.replace(/%22/g, "\"");
    url = url.replace(/%5C/g, "\\");
    url = url.replace(/%36/g, "&");
    url = url.replace(/%2B/g, "+");
    url = url.replace(/%2C/g, ",");
    url = url.replace(/%2F/g, "/");
    return url;
}

function getURLwithParams() {
    var url = window.location.href;
    var sliceTo = url.indexOf('?');
    if (sliceTo === -1) sliceTo = url.length;
    var url = window.location.href.slice(0, sliceTo);
	var params = "?vs=";
	params += stringToUrl(getVertSource());
	params += "&fs=";
	params += stringToUrl(getFragSource());
	document.getElementById('shareURL').value = (url+params);
}

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
