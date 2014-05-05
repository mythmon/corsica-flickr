/* Description:
 *   detects image MIME-types and presents the image more attractively.
 *
 * Author:
 *    potch, mythmon
 */

var nodeUtils = require('util');
var Promise = require('es6-promise').Promise;


module.exports = function (corsica) {
  request = corsica.request;

  corsica.on('flickr.interesting', function(msg) {

    new Promise(function(resolve, reject) {
      var opts = {
        url: 'https://api.flickr.com/services/rest/',
        json: true,
        qs: {
          method: 'flickr.interestingness.getList',
          format: 'json',
          api_key: '80ddce57ddd86e1877ca4a261559e5e8',
          nojsoncallback: 1,
          extras: 'owner_name,tags,machine_tags,o_dims,description,url_o,url_b',
          per_page: 500,
        },
      };
      request.get(opts, function flickrCallback(error, response, body) {
        if (error) {
          reject(error);
        } else {
          resolve(body);
        }
      });
    })
    .then(function(apiResponse) {
      var allPhotos = apiResponse.photos.photo.filter(function(p) {
        return !!(p.url_o || p.url_b);
      });
      var photoUrl;

      var index = Math.floor(Math.random() * allPhotos.length);
      var photo = allPhotos[index];
      // o: original. b: large.
      var photoUrl = photo.url_o || img.url_b;

      corsica.sendMessage('content', {
        url: photoUrl,
        screen: msg.screen,
      });
    });

    return msg;
  });
};
