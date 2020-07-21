if (typeof buildfire == "undefined")
  throw "please add buildfire.js first to use buildfire components";

if (typeof buildfire.components == "undefined") buildfire.components = {};

class Stars {
  /**
   *
   * @param {String} containerSelector Query selector of container in which stars will be rendered
   * @param {String} ratingId Unique id of item that is being rated - usually from database
   * @param {Object} options Options object, empty now
   */
  constructor(containerSelector, ratingId, options) {
    this.containerSelector = containerSelector;
    this.ratingId = ratingId;
    this.options = options;
  }

  emptyStar = "☆";
  fullStar = "★";

  render() {
    const starsContainer = document.querySelector(this.containerSelector);
    if (!starsContainer)
      return console.error(
        `Container element ${this.containerSelector} not found in DOM`
      );

    this.createStarsUI().forEach((star) => {
      console.log(star);
      starsContainer.appendChild(star);
    });
  }

  createStarsUI() {
    let that = this;
    let stars = [];
    for (let i = 0; i < 5; i++) {
      let star = document.createElement("div");
      star.id = `star${i}`;
      star.addEventListener("click", function () {
        let starIndex = Number(star.id.slice(4));
        for (let i = 0; i < 5; i++) {
          document.getElementById(`star${i}`).innerHTML =
            i <= starIndex ? that.fullStar : that.emptyStar;
        }
      });
      star.innerHTML = this.emptyStar;
      stars.push(star);
    }
    return stars;
  }

  closeRatingsScreen() {
    let ratingsScreen = document.querySelector(".ratings-screen");

    document.body.removeChild(ratingsScreen);
    buildfire.navigation.restoreBackButtonClick();
  }


  openRatingsScreen() {
    let container = document.createElement("div");
    container.className = "ratings-screen";

    buildfire.spinner.show();


    buildfire.navigation.onBackButtonClick = () => {
      this.closeRatingsScreen();
    }

    Ratings.search({
      filter: {
        // "_buildfire.index.string1": this.ratingId
      }
    }, (err, ratings) => {
      if (err) return callback(err);
      ratings.forEach(rating => {
        let ratingUI = this.createRatingUI(rating);
        container.appendChild(ratingUI);
      })

      document.body.appendChild(container)
      buildfire.spinner.hide();
    })
  }

  showReviewScreen() {
    let container = document.createElement("div");
    container.className = "ratings-screen";

    buildfire.spinner.show();


    buildfire.navigation.onBackButtonClick = () => {
      this.closeRatingsScreen();
    }

    Ratings.search({
      filter: {
        // "_buildfire.index.string1": this.ratingId
      }
    }, (err, ratings) => {
      if (err) return callback(err);
      ratings.forEach(rating => {
        let ratingUI = this.createRatingUI(rating);
        this.addControlsToRating(ratingUI)
        container.appendChild(ratingUI);
      })

      document.body.appendChild(container)
      buildfire.spinner.hide();
    })
  }

  addControlsToRating(rating) {
    let deleteButton = document.createElement("button");
    deleteButton.innerText = "Delete";
    deleteButton.className = "delete-button"
    deleteButton.addEventListener("click", () => {
      buildfire.notifications.confirm(
        {
          title: "Are you sure?",
          message: "Are you sure you want to remove this review?",
          confirmButton: { text: "Yes", key: "yes", type: "danger" },
          cancelButton: { text: "No", key: "no", type: "default" }
        },
        function (e, data) {
          if (e && e !== 2) {
            console.log("remove rating")
          }
        }
      );
    })
    rating.appendChild(deleteButton)
  }

  createRatingUI(rating) {
    let container = document.createElement("div");
    container.className = "ratings-screen-rating";

    let header = document.createElement("div");
    header.className = "rating-header";
    container.appendChild(header);

    let profileImage = document.createElement("img");
    profileImage.className = "rating-user-image";
    profileImage.src = rating.user && rating.user.imageUrl ? rating.user.imageUrl : "https://pluginserver.buildfire.com/styles/media/avatar-placeholder.png"
    profileImage.src = buildfire.imageLib.resizeImage(profileImage.src, {
      size: "s",
      aspect: "1:1",
    })
    header.appendChild(profileImage);

    let nameAndStars = document.createElement("div");
    nameAndStars.className = "rating-name-and-stars";
    header.appendChild(nameAndStars)

    let userName = document.createElement("div");
    userName.className = "rating-user-display-name";
    userName.innerText = rating.user && rating.user.displayName ? rating.user.displayName : "Unknown User";
    nameAndStars.appendChild(userName);

    let stars = document.createElement("div");
    stars.className = "rating-user-stars";
    nameAndStars.appendChild(stars);

    let starsSpan = document.createElement("span");
    starsSpan.className = "rating-user-stars";
    let starsText = "";
    for (let i = 0; i < 5; i++) {
      if (i < Number(rating.rating))
        starsText += this.fullStar;
      else starsText += this.emptyStar;
    }
    starsSpan.innerText = starsText;
    let ratingTime = document.createElement("span");
    ratingTime.className = "rating-time-ago"
    ratingTime.innerHTML = this.getTimeAgo(new Date(rating.createdOn));

    stars.appendChild(starsSpan);
    stars.appendChild(ratingTime);

    let ratingReview = document.createElement("div");
    ratingReview.className = "rating-review";
    container.appendChild(ratingReview);

    let ratingReviewText = document.createElement("div");
    ratingReviewText.className = "rating-review-text";
    ratingReviewText.innerText = rating.comment;
    ratingReview.appendChild(ratingReviewText);

    let ratingImages = document.createElement("div");
    ratingImages.className = "rating-review-images";
    ratingReview.appendChild(ratingImages);

    for (let i = 0; i < rating.images.length; i++) {
      const imageUrl = rating.images[i];
      let image = document.createElement("img");
      image.className = "rating-review-image";
      image.src = buildfire.imageLib.resizeImage(imageUrl, {
        size: "m",
        aspect: "1:1"
      })
      ratingImages.appendChild(image)
    }

    return container;
  }

  getTimeAgo(date) {
    let seconds = Math.floor((new Date() - date) / 1000);

    let interval = Math.floor(seconds / 31536000);

    if (interval > 1) return interval + " years ago";
    interval = Math.floor(seconds / 2592000);

    if (interval > 1) return interval + " months ago";
    interval = Math.floor(seconds / 86400);

    if (interval > 1) return interval + " days ago";
    interval = Math.floor(seconds / 3600);

    if (interval > 1) return interval + " hours ago";
    interval = Math.floor(seconds / 60);

    if (interval > 1) return interval + " minutes ago";

    return Math.floor(seconds) + " seconds ago";
  }

  closeAddRatingScreen() {
    let addRatingScreen = document.querySelector(".add-rating-screen");

    document.body.removeChild(addRatingScreen);

    buildfire.navigation.restoreBackButtonClick();
  }

  openAddRatingScreen(containerSelector, callback) {
    buildfire.auth.getCurrentUser((err, loggedInUser) => {
      if (err || !loggedInUser) throw new Error("User not logged in")

      buildfire.navigation.onBackButtonClick = () => {
        this.closeAddRatingScreen();
        buildfire.navigation.restoreBackButtonClick();
      }

      // let userContainer = document.querySelector(containerSelector);
      let rating = new Rating({
        data: {
          createdBy: loggedInUser._id,
          user: {
            _id: loggedInUser._id,
            displayName: loggedInUser.displayName,
            imageUrl: loggedInUser.imageUrl
          },
          ratingId: this.ratingId
        }
      });
      let container = document.createElement("div");
      container.className = "add-rating-screen";

      let image = document.createElement("img");
      image.className = "user-profile-image";
      image.src = buildfire.imageLib.resizeImage(loggedInUser.imageUrl, {
        size: "s",
        aspect: "1:1",
      });

      let heading4 = document.createElement("h4");
      heading4.innerText = "Rate and review";

      let heading5 = document.createElement("h5");
      heading5.innerText = "Share your experience to help others";

      let ratingStars = document.createElement("div");
      ratingStars.className = "rating-stars";
      for (let i = 0; i < 5; i++) {
        let star = document.createElement("div");
        star.id = "stars" + i;
        star.addEventListener("click", function () {
          rating.rating = i + 1;
          for (let j = 0; j < 5; j++) {
            const star = document.getElementById("stars" + j);
            star.innerText = j <= i ? fullStar : emptyStar;
          }
        });
        star.innerHTML = emptyStar;
        ratingStars.appendChild(star);
      }

      const openTextDialog = () => {
        buildfire.input.showTextDialog(
          {
            placeholder: "Write a review...",
            saveText: "Save",
            defaultValue:
              textArea.innerText !== "Write a review..."
                ? textArea.innerText
                : "",
            attachments: {
              images: {
                enable: true,
                multiple: true,
              },
            },
          },
          (e, response) => {
            if (e || response.cancelled) return;
            textArea.innerText = response.results[0].textValue;
            rating.comment = response.results[0].textValue;
            rating.images = [...rating.images, ...response.results[0].images];
            appendImages(rating.images);
          }
        );
      };

      let textArea = document.createElement("div");
      textArea.innerText = "Write a review...";
      textArea.className = "text-area";
      textArea.addEventListener("click", openTextDialog);

      let imagesContainer = document.createElement("images");
      imagesContainer.className = "review-images-container";

      const removeImage = (index) => {
        rating.images.splice(index, 1);
        appendImages(rating.images);
      };

      const appendImages = (images) => {
        imagesContainer.innerHTML = "";
        images.forEach((imageUrl, index) => {
          let imageContainer = document.createElement("div");
          imageContainer.className = "review-image-container";

          let deleteImageButton = document.createElement("div");
          deleteImageButton.className = "review-image-delete";
          deleteImageButton.innerHTML = "✖";
          deleteImageButton.style.background = "red";
          deleteImageButton.style.color = "white";

          let image = document.createElement("img");
          image.className = "review-image";
          image.src = buildfire.imageLib.resizeImage(imageUrl, {
            size: "s",
            aspect: "1:1",
          });
          imageContainer.appendChild(image);
          imageContainer.appendChild(deleteImageButton);
          imageContainer.addEventListener("click", () => {
            removeImage(index);
          });

          imagesContainer.appendChild(imageContainer);
        });
      };

      let addPhotosButton = document.createElement("button");
      addPhotosButton.innerText = "Add Photos";
      addPhotosButton.className = "add-photos material-button";
      addPhotosButton.addEventListener("click", openTextDialog);

      let submitButton = document.createElement("button");
      submitButton.className = "submit-button material-button";
      submitButton.innerText = "Submit Review";
      submitButton.addEventListener("click", () => {
        Ratings.add(rating, (err, addedRating) => {
          this.closeAddRatingScreen();
          callback(err, addedRating)
        })
      });

      container.appendChild(image);
      container.appendChild(heading4);
      container.appendChild(heading5);
      container.appendChild(ratingStars);
      container.appendChild(textArea);
      container.appendChild(imagesContainer);
      container.appendChild(addPhotosButton);
      container.appendChild(submitButton);

      document.body.appendChild(container);
    });
  }

  rate(rating, comment, images) {
    // let rating = NEW
  }

  createRatingDrawer() {
    let drawer = document.createElement("div");
    drawer.classList.add("rating-drawer");
  }

  getSummary(cb) {
    const filters = {
      filter: {
        "_buildfire.index.string1": this.ratingId,
      },
    };
    Summaries.search(filters, (err, summaries) => {
      if (err) return cb(err);
      return cb(null, summaries[0]);
    });
  }

  getUsersRating(cb) {
    if (!this.user) return cb(new Error("Not logged in"));

    const filters = {
      filter: {
        "_buildfire.index.string1": this.ratingId,
      },
    };

    Ratings.search;
  }
}

class Reviews { }

class Rating {
  constructor(record = {}) {
    if (!record.data) record.data = {};
    this.id = record.id || undefined;
    this.isActive =
      typeof record.data.isActive === "boolean" ? record.data.isActive : true;
    this.createdOn = record.data.createdOn || new Date();
    this.createdBy = record.data.createdBy || undefined;
    this.lastUpdatedOn = record.data.lastUpdatedOn || undefined;
    this.lastUpdatedBy = record.data.lastUpdatedBy || undefined;
    this.deletedOn = record.data.deletedOn || undefined;
    this.deletedBy = record.data.deletedBy || undefined;

    this.user = record.data.user || {
      _id: "",
      displayName: "",
      imageUrl: "",
    };
    this.ratingId = record.data.ratingId || undefined;
    this.rating = record.data.rating || undefined;
    this.comment = record.data.comment || "";
    this.images = record.data.images || [];
  }

  /**
   * Get instance ready for data access with _buildfire index object
   */
  toJSON() {
    return {
      id: this.id,
      isActive: this.isActive,
      createdOn: this.createdOn,
      createdBy: this.createdBy,
      lastUpdatedOn: this.lastUpdatedOn,
      lastUpdatedBy: this.lastUpdatedBy,
      deletedOn: this.deletedOn,
      deletedBy: this.deletedBy,

      user: this.user,
      ratingId: this.ratingId,
      rating: this.rating,
      comment: this.comment,
      images: this.images,
      _buildfire: {
        index: {
          number1: this.isActive ? 1 : 0,
          date1: this.createdOn,
          array1: [this.rating, this.user._id],
          string1: this.ratingId,
        },
      },
    };
  }
}

class Summary {
  constructor(record = {}) {
    if (!record.data) record.data = {};
    this.id = record.id || undefined;

    this.ratingId = record.data.ratingId || null;
    this.count = record.data.count || 0;
    this.total = record.data.total || 0;
  }

  /**
   * Get instance ready for data access with _buildfire index object
   */
  toJSON() {
    return {
      id: this.id,
      ratingId: this.ratingId,
      count: this.count,
      total: this.total,
      _buildfire: {
        index: {
          string1: this.ratingId,
        },
      },
    };
  }
}

class Summaries {
  /**
   * Get Database Tag
   */
  static get TAG() {
    return "fivestarsummary";
  }

  /**
   * Get List Of Summaries
   * @param {Object} filters Filters object with search operators
   * @param {Function} callback Callback function
   */
  static search(filters, callback) {
    buildfire.appData.search(filters, Summaries.TAG, (err, records) => {
      if (err) return callback(err);
      return callback(
        null,
        records.map((record) => new Summary(record))
      );
    });
  }

  static get;
}

class Ratings {
  /**
   * Get Database Tag
   */
  static get TAG() {
    return "rating";
  }

  /**
   * Get List Of Ratings
   * @param {Object} filters Filters object with search operators
   * @param {Function} callback Callback function
   */
  static search(filters, callback) {
    buildfire.appData.search(filters, Ratings.TAG, (err, records) => {
      if (err) return callback(err);
      return callback(
        null,
        records.map((record) => new Rating(record))
      );
    });
  }
  /**
   * Add new rating
   * @param {Rating} rating Instance of rating data class
   * @param {Function} callback Callback function
   */
  static add(rating, callback) {
    if (!(rating instanceof Rating))
      return callback(new Error("Only Rating instance can be used"));

    if (!rating.user || !rating.user._id) return (callback(new Error("User must be logged in")));

    // Check if there is an existing rating from this user
    Ratings.search({
      filter: {
        "_buildfire.index.array1": rating.user._id,
        "_buildfire.index.string1": rating.ratingId
      }
    }, (err, ratings) => {
      if (err) return callback(err);
      if (ratings && ratings.length) return callback(new Error("User already rated item"))
      if (!ratings || ratings.length === 0) {
        rating.createdOn = new Date();

        buildfire.appData.insert(
          rating.toJSON(),
          Ratings.TAG,
          false,
          (err, record) => {
            if (err) return callback(err);
            return callback(null, new Rating(record));
          }
        );
      }
    });

  }
  /**
   * Edit single rating instance
   * @param {Rating} rating Instance of rating data class
   * @param {Function} callback Callback function
   */
  static set(rating, callback) {
    if (!(rating instanceof Rating))
      return callback(new Error("Only Rating instance can be used"));

    rating.lastUpdatedOn = new Date();
    rating.lastUpdatedBy = authManager.currentUser._id;

    buildfire.appData.update(
      rating.id,
      rating.toJSON(),
      Ratings.TAG,
      (err, record) => {
        if (err) return callback(err);
        return callback(null, new Rating(record));
      }
    );
  }
  /**
   * Delete single rating instance
   * @param {Rating} rating Instance of rating data class
   * @param {Function} callback Callback function
   */
  static del(rating, callback) {
    if (!(rating instanceof Rating))
      return callback(new Error("Only Rating instance can be used"));

    rating.deletedBy = authManager.currentUser._id;
    rating.deletedOn = new Date();
    rating.isActive = false;

    buildfire.appData.update(
      rating.id,
      rating.toJSON(),
      Ratings.TAG,
      (err, record) => {
        if (err) return callback(err);
        return callback(null, new Rating(record));
      }
    );
  }
}

buildfire.components.ratingSystem = {
  stars: Stars,
  reviews: Reviews,
};
