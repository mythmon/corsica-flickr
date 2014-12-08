/* Description:
 *   Do stuff with flickr.
 *
 * Author:
 *    potch, mythmon
 */

var nodeUtils = require('util');
var Promise = require('es6-promise').Promise;

var request = null;
var template = '<body style="margin: 0; height: 100%; background: url(%s) no-repeat center %s; background-size: contain;"></body>';
var allUrlTypes = 'url_s,url_q,url_t,url_m,url_n,url_z,url_c,url_b,url_h,url_k,url_o';

function apiCall(opts) {
  opts.format = 'json';
  opts.api_key = '80ddce57ddd86e1877ca4a261559e5e8';
  opts.nojsoncallback = 1;

  return new Promise(function(resolve, reject) {
    var reqOpts = {
      url: 'https://api.flickr.com/services/rest/',
      json: true,
      qs: opts,
    };
    request.get(reqOpts, function flickrCallback(error, response, body) {
      if (error) {
        reject(error);
      } else {
        if (body.stat === 'fail') {
          reject(body);
        } else {
          resolve(body);
        }
      }
    });
  });
}

function getNiceImage(apiResponse) {
  var allPhotos = apiResponse.photos.photo
  .map(function(p) {
    // Look at every size of url provided by the API, and pick the biggest one.
    // This could be implemented with a list of the types of urls in descending
    // size, and pickign the first one found. This will still work even if the
    // api gets different sizes in the future.
    var largestType;
    var largestTypeSize = -Infinity;
    var match;
    for (var key in p) {
      match = /width_(.*)/.exec(key);
      if (match) {
        if (p[key] > largestTypeSize) {
          largestTypeSize = p[key];
          largestType = match[1];
        }
      }
    }
    if (largestType !== null) {
      p.url = p['url_' + largestType];
    } else {
      console.error('nothing found');
      return null;
    }
    return p;
  })
  .filter(function(p) { return p !== null; });

  var index = Math.floor(Math.random() * allPhotos.length);
  return allPhotos[index];
}


module.exports = function (corsica) {
  request = corsica.request;

  corsica.on('flickr.interesting', function(msg) {
    apiCall({
      method: 'flickr.interestingness.getList',
      extras: 'url_o,url_b',
      per_page: 500,
    })
    .then(function(apiResponse) {
      var image = getNiceImage(apiResponse);
      corsica.sendMessage('content', {
        url: photo.url,
        screen: msg.screen,
      });
    });

    return msg;
  });

  corsica.on('content', function(content) {
    var match = /flickr.com\/photos\/[^\/]+\/galleries/.exec(content.url);
    if (content.type === 'url' && match) {
      return apiCall({
        method: 'flickr.urls.lookupGallery',
        url: content.url,
      })
      .then(function(apiResponse) {
        return apiCall({
          method: 'flickr.galleries.getPhotos',
          gallery_id: apiResponse.gallery.id,
          // extras: 'url_o,url_b',
          extras: 'url_s,url_q,url_t,url_m,url_n,url,url_z,url_c,url_b,url_h,url_k,url_o',
        });
      })
      .then(function(apiResponse) {
        var photo = getNiceImage(apiResponse);
        var bgColor = content.bg || '#000';
        content.type = 'html';
        content.content = nodeUtils.format(template, photo.url, bgColor);
        return content;
      });
    } else {
      return content;
    }
  });
};
