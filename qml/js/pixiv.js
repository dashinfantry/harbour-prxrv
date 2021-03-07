.pragma library

var base_url = 'https://public-api.secure.pixiv.net/v1'
var app_url_v1 = 'https://app-api.pixiv.net/v1'
var app_url_v2 = 'https://app-api.pixiv.net/v2'
var client_id = 'MOBrBDS8blbauoSck0ZfDbtuzpyT'
var client_secret = 'lsACyCD94FhDUtGTXi3QzcFE2uU1hqtDaKeqrdwj'

function checkToken(token, msg) {
    //console.log('Token for ' + msg + '(): ' + token);
    if (token == '') {
        console.log('Token is empty');
        return false;
    }
    return true;
}

function serialize(obj) {
    var str = [];
    for (var p in obj) {
        if (obj.hasOwnProperty(p)) {
            if (obj[p] && obj[p] instanceof Array) {
                for (var i in obj[p]) {
                    str.push(encodeURIComponent(p) + "=" + encodeURIComponent(obj[p][i]));
                }
            } else {
                str.push(encodeURIComponent(p) + "=" + encodeURIComponent(obj[p]));
            }
        }
    }
    return str.join("&");
}

function sendRequest(method, token, url, params, callback) {

    var xmlhttp = new XMLHttpRequest();

    var params_str = serialize(params)

    xmlhttp.onreadystatechange = function() {
        console.log('http ready: ' + xmlhttp.readyState);
        if (xmlhttp.readyState == 4) {
            console.log('http status: ' + xmlhttp.status);
            if (token == '' && xmlhttp.status == 400) {
                console.error('Login failed!');
                typeof(callback) === 'function' && callback(null);
            } else if (xmlhttp.status == 200) {
                var resp_j = JSON.parse(xmlhttp.responseText);
                //console.log('resp_j', JSON.stringify(resp_j))
                if (token == '' || resp_j) {
                    typeof(callback) === 'function' && callback(resp_j);
                }
            } else { // if (xmlhttp.status == 0) {   // or 404
                console.error('Failed to fetch data from ' + url);
                typeof(callback) === 'function' && callback(null);
            }
        }
    }

    xmlhttp.ontimeout = function() {
        console.error('The request for ' + url + ' timed out.');
        typeof(callback) === 'function' && callback(null);
    };

    if ((method == 'GET' || method == 'DELETE') && params_str != '') url += '?' + params_str;

    var headers = {
        'Referer': 'https://app-api.pixiv.net/',
        'App-OS': 'ios',
        'App-OS-Version': '10.3.1',
        'App-Version': '6.7.1',
        'User-Agent': 'PixivIOSApp/6.7.1 (iOS 10.3.1; iPhone8,1)',
    }

    xmlhttp.open(method, url, true);
    for (var key in headers) {
        xmlhttp.setRequestHeader(key, headers[key]);
    }
    if (token !== '') xmlhttp.setRequestHeader('Authorization', 'Bearer ' + token);

    // TODO
    xmlhttp.timeout = 6000;

    switch (method) {
        case 'POST':
            xmlhttp.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
            xmlhttp.send(params_str);
            break;
        case 'GET':
        case 'DELETE':
            xmlhttp.send();
            break;
        default:
            console.log("Nothing to send OR not supported method " + method);
    }
}


// Search
//
// params: q, mode, sort, order, period
//
//     mode: tag, caption, text
//     sort: date, popular
//     order: desc, asc
//     period: day, week, month, all
//     types: illustration, manga, ugoira
//
// sort-by-popular only works with 'asc' order,
// and returns at most 20 items for non-premium user
//
function searchWorks(token, params, page, callback) {
    if (!checkToken(token, 'search')) return;

    var url = base_url + '/search/works.json';

    if (params.sort === 'popular') {
        params.order = 'desc';
    }
    params.types = 'illustration,manga,ugoira';
    params.page = page
    params.per_page = 20;
    params.include_stats = 'true';
    params.image_sizes = 'px_128x128,large,px_480mw';

    sendRequest('GET', token, url, params, callback);
}

// TODO
function searchNovel(token, params, page, callback) {
    if (!checkToken(token, 'search')) return;
    var url = base_url + '/search/novels.json';
    sendRequest('GET', token, url, params, callback);
}


// Feeds
//
function getFeeds(token, user_id, show_r18, callback, max_id) {
    if (!checkToken(token, 'getFeeds')) return;
    var url = base_url + '/users/' + user_id + '/feeds.json';
    var params = {
        'relation': 'all',
        'type': 'touch_nottext',
        'show_r18': show_r18 || false,
    };

    if (typeof(max_id) === 'number') {
        params['max_id'] = max_id.toString();
    } else if (typeof(max_id) !== 'undefined') {
        console.log('Type of max_id error: ' + typeof(max_id));
    }
    sendRequest('GET', token, url, params, callback);
}

function getStacc(token, show_r18, callback, max_id) {
    if (!checkToken(token, 'getStacc')) return;
    var url = base_url + '/me/feeds.json';
    // here show_r18 only can be 1 or 0, true or false not work
    var params = {
        'relation': 'all',
        'type': 'touch_nottext',
        'show_r18': show_r18 ? '1' : '0',
    };

    if (typeof(max_id) === 'number') {
        params['max_id'] = max_id.toString();
    } else if (typeof(max_id) !== 'undefined') {
        console.log('Type of max_id error: ' + typeof(max_id));
    }
    sendRequest('GET', token, url, params, callback);
}


// Ranking
//
function getRankingWork(token, type, mode, page, callback) {
    if (!checkToken(token, 'getRankingWork: ' + type + '|' + mode)) return;
    var url = base_url + '/ranking/' + type + '.json';
    var params = {
        'mode': mode,
        'page': page,
        'include_stats': 'true',
        'image_sizes': 'px_128x128,large,px_480mw',
    };
    sendRequest('GET', token, url, params, callback);
}


// Trending tags (App API)
//
function getTrendingTags(token, callback) {
    if (!checkToken(token, 'getTrendingTags')) return;
    var url = app_url_v1 + '/trending-tags/illust';
    var params = {
        'filter': 'for_ios',
    };
    sendRequest('GET', token, url, params, callback);
}


// Recommendation (App API)
//
function getRecommendation(token, page, callback) {
    if (!checkToken(token, 'getRecommendation')) return;
    var url = app_url_v1 + '/illust/recommended';
    var params = {
        'content_type': 'illust',
        'include_ranking_label': 'true',
        'filter': 'for_ios',
        'offset': (page-1) * 30,
    };
    sendRequest('GET', token, url, params, callback);
}


// Related works (App API)
//
function getRelatedWorks(token, illust_id, seed_ids, page, callback) {
    if (!checkToken(token, 'getRelatedWorks')) return;
    var url = app_url_v2 + '/illust/related';
    var params = {
        'illust_id': illust_id,
        'filter': 'for_ios',
        'seed_illust_ids[]': seed_ids,
        'offset': (page-1) * 30,
    };
    sendRequest('GET', token, url, params, callback);
}

// Latest Works
//
function getLatestWork(token, page, callback) {
    if (!checkToken(token, 'getLatestWork')) return;
    var url = base_url + '/works.json';
    var params = {
        'include_stats': 'true',
        'image_sizes': 'px_128x128,px_480mw,large',
        'page': page,
        'per_page': '50',
    };
    sendRequest('GET', token, url, params, callback);
}

// Following works (App API)
//
function getFollowingWorks(token, url, params, callback) {
    if (!checkToken(token, 'getFollowingWorks')) return;
    if (!url) {
        url = app_url_v2 + '/illust/follow'
        sendRequest('GET', token, url, params, callback);
    } else {
        sendRequest('GET', token, url, params, callback);
    }
}


// Following Works
//
function getFollowingWork(token, page, callback) {
    if (!checkToken(token, 'getFollowingWork')) return;
    var url = base_url + '/me/following/works.json';
    var params = {
        'include_stats': 'true',
        'image_sizes': 'px_128x128,px_480mw,large',
        'page': page,
        'per_page': '50',
    };
    sendRequest('GET', token, url, params, callback);
}

// User Works
//
function getUserWork(token, user, page, callback) {
    if (!checkToken(token, 'getUserWork')) return;
    var url = base_url + '/users/' + user + '/works.json';
    var params = {
        'include_stats': 'true',
        'image_sizes': 'px_128x128,px_480mw,large',
        'page': page,
        'per_page': '50',
    };
    sendRequest('GET', token, url, params, callback);
}


// Work Details
//
function getWorkDetails(token, work_id, callback) {
    if (!checkToken(token, 'getWorkDetails')) return;
    var url = base_url + '/works/' + work_id + '.json';
    var params = {
        'include_stats': 'true',
        'caption_format': 'html',
        'image_sizes': 'px_480mw,large',
    };
    sendRequest('GET', token, url, params, callback);
}
function getWorkDetails2(token, illust_id, callback) {
    if (!checkToken(token, 'getWorkDetails2')) return;
    var url = app_url_v1 + '/illust/detail';
    var params = {
        'illust_id': illust_id
    }
    sendRequest('GET', token, url, params, callback);
}

// User Details
//
function getUser(token, user_id, callback) {
    if (!checkToken(token, 'getUser')) return;
    var url = base_url + '/users/' + user_id + '.json';
    var params = {
        'include_stats': '1',
        'include_profile': '1',
        'include_workspace': '1',
        'include_contacts': '1',
    };
    sendRequest('GET', token, url, params, callback);
}


// Following User
//
function getFollowing(token, user_id, page, callback) {
    if (!checkToken(token, 'getFollowing')) return;
    var url = base_url + '/users/' + user_id + '/following.json';
    var params = {
        'per_page': '20',
        'page': page
    };
    sendRequest('GET', token, url, params, callback);
}

function getMyFollowing(token, publicity, page, callback) {
    if (!checkToken(token, 'getMyFollowing')) return;
    var url = base_url + '/me/following.json';
    var params = {
        'publicity': publicity,
        'page': page,
        'per_page': '20',
    };
    sendRequest('GET', token, url, params, callback);
}

// This returns only one user per page :(
function getMyFollowing1(token, publicity, callback) {
    if (!checkToken(token, 'getMyFollowing2')) return;
    var url = base_url + '/me/favorite-users.json';
    var params = {
        'publicity': publicity
    };
    sendRequest('GET', token, url, params, callback);
}

function followUser(token, user_id, publicity, callback) {
    if (!checkToken(token, 'followUser')) return;
    var url = base_url + '/me/favorite-users.json';
    var postdata = {
        'target_user_id': user_id,
        'publicity': publicity
    };
    sendRequest('POST', token, url, postdata, callback);
}

function unfollowUser(token, user_id, callback) {
    if (!checkToken(token, 'unfollowUser')) return;
    var url = base_url + '/me/favorite-users.json';
    var params = {
        'delete_ids': user_id
    };
    sendRequest('DELETE', token, url, params, callback);
}


// Favorite Works
//
function getFavoriteWork(token, user_id, page, callback) {
    if (!checkToken(token, 'getFavoriteWork')) return;
    var url = base_url + '/users/' + user_id + '/favorite_works.json';
    var params = {
        'include_stats': 'true',
        'image_sizes': 'px_128x128,px_480mw,large',
        'page': page,
        'per_page': '50',
    };
    sendRequest('GET', token, url, params, callback);
}

function getMyFavoriteWork(token, publicity, page, callback) {
    if (!checkToken(token, 'getMyFavoriteWork')) return;
    var url = base_url + '/me/favorite_works.json';
    var params = {
        'publicity': publicity,
        'include_stats': 'true',
        'image_sizes': 'px_128x128,px_480mw,large',
        'page': page,
        'per_page': '50',
    };
    sendRequest('GET', token, url, params, callback);
}


// Bookmark Work
//
function getBookmarks(token, url, params, callback) {
    if (!url) {
        url = app_url_v1 + '/user/bookmarks/illust'
        params['filter'] = 'for_ios'
        sendRequest('GET', token, url, params, callback);
    } else {
        sendRequest('GET', token, url, {}, callback);
    }
}

function bookmarkWork(token, illust_id, publicity, callback) {
    if (!checkToken(token, 'bookmarkWork')) return;
    var url = app_url_v2 + '/illust/bookmark/add';
    var postdata = {
        'illust_id': illust_id,
        'restrict': publicity
        // 'tags': 'TODO'
    };
    sendRequest('POST', token, url, postdata, callback);
}

function unbookmarkWork(token, illust_id, callback) {
    if (!checkToken(token, 'unbookmarkWork')) return;
    var url = app_url_v1 + '/illust/bookmark/delete';
    var postdata = {
        'illust_id': illust_id
    };
    sendRequest('POST', token, url, postdata, callback);
}

function getComments(token, illust_id) {
    if (!checkToken(token, 'getComments')) return;
    var url = app_url_v1 + '/illust/comments';
    var params = {
        'illust_id': illust_id
    }
    sendRequest('GET', token, url, params, callback);
}


// Login
//
function login(username, password, callback) {
    var url = 'https://oauth.secure.pixiv.net/auth/token';
    var postdata = {
        'grant_type': 'password',
        'get_secure_url': 1,
        'client_id': client_id,
        'client_secret': client_secret,
        'username': username,
        'password': password,
    };
    sendRequest('POST', '', url, postdata, callback);
}

function relogin(refresh_token, callback) {
    var url = 'https://oauth.secure.pixiv.net/auth/token';
    var postdata = {
        'grant_type': 'refresh_token',
        'get_secure_url': 1,
        'client_id': client_id,
        'client_secret': client_secret,
        'refresh_token': refresh_token,
    };
    sendRequest('POST', '', url, postdata, callback);
}

