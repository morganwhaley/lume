var Lume = function() {
    // Create a feeds object we can add to if we want more photo streams later. This way all the feed info is in one place.
    this.feeds = {
        flickr: {
            api_key: 'bda4e281c1bcfdfd957cf2181b858c77',
            tags: 'shiba',
            media: 'photos',
            per_page: '40'
        }
    };
};

Lume.prototype.init = function() {
    this.callFlickrPhotoFeed();
};

// Get the Flickr API call ready and happening
Lume.prototype.callFlickrPhotoFeed = function() {
    var flickrReq = this.feeds.flickr;
    var url = 'https://api.flickr.com/services/rest/?method=flickr.photos.search&api_key=' + flickrReq.api_key + '&tags=' + flickrReq.tags + '&media=' + flickrReq.media + '&per_page=' + flickrReq.per_page + '&public=1&format=json&nojsoncallback=1';
    var context = this;
    var xhr = new XMLHttpRequest();
    xhr.open('GET', url, true);
    xhr.send();
    xhr.onload = function() {
        if (xhr.status === 200) {
            // Parse the JSON results and send them over for normalization into our UI
            var JSONResults = JSON.parse(xhr.responseText);
            context.normalizePhotoResults(JSONResults);
        }
        else {
            // Create a graceful failure if the call fails
            context.handleRequestError(xhr.status);
        }
    }
};

Lume.prototype.normalizePhotoResults = function(result) {
    var context = this;
    if (typeof result === 'undefined') {
        return;
    }
    for (var item in result.photos.photo) {
        var photo = result.photos.photo[item];
        // Create a photo item object we can work with in other functions
        var photoItemObj = {
            farm_id: photo.farm,
            title: photo.title,
            id: photo.id,
            secret: photo.secret,
            server: photo.server
        };
        this.createPhotoItem(photoItemObj);
    }
};

Lume.prototype.handleRequestError = function(status) {
    console.log(status);
};

// Create the thumbnail URLs
Lume.prototype.buildPhotoThumbURLs = function(photoItemObj) {
    return 'https://farm' + photoItemObj.farm_id + '.staticflickr.com/' + photoItemObj.server + '/' + photoItemObj.id + '_' + photoItemObj.secret + '_m.jpg';
};

// Create the fullsize URLs for the light boxes from the image source of the target
Lume.prototype.buildFullsizePhotoURLs = function(target) {
    var imageSource = target.src;
    // strip out the character before file extension
    var newImg = imageSource.replace('_m.jpg', '_c.jpg');
    console.log(newImg);


    //return 'https://farm' + photoItemObj.farm_id + '.staticflickr.com/' + photoItemObj.server + '/' + photoItemObj.id + '_' + photoItemObj.secret + '.jpg';
};

Lume.prototype.createPhotoItem = function(photoItemObj) {
    var context = this;

    // Create each separate thumbnail in the DOM and add them to the #gallery div
    var thumbnailPath = this.buildPhotoThumbURLs(photoItemObj);
    var lightboxThumb = document.createElement('img');
    lightboxThumb.setAttribute('src', thumbnailPath);
    lightboxThumb.setAttribute('class', 'photo_thumb');
    lightboxThumb.setAttribute('data-photo-id', photoItemObj.id);
    lightboxThumb.setAttribute('data-photo-title', photoItemObj.title);
    document.getElementById('gallery').appendChild(lightboxThumb);

    // Attach a click listener to each photo to launch the lighbox
    lightboxThumb.addEventListener('click', function(e) { context.handlePhotoClick(e); });
};

Lume.prototype.handlePhotoClick = function(e) {
    e.preventDefault;
    var target = e.target;
    this.buildFullsizePhotoURLs(target);
    //var fullsizeImage = this.buildFullsizePhotoURLs(target);
    //console.log(fullsizeImage);

};

Lume.prototype.launchLightbox = function(image) {

};


document.addEventListener('DOMContentLoaded', function() {
  var lume = new Lume();
  lume.init();
});