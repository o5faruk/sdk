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
  constructor(ratingId, options) {
    this.ratingId = ratingId;
    this.options = options;
  }

  emptyStar = "☆";
  fullStar = "★";

  injectAverageRating(containerSelector, options) {
    let container = document.querySelector(containerSelector);
    if (!container) return console.error(`Selector ${containerSelector} not found in DOM`);

    container.innerHTML = "";

    const filters = {
      filter: {
        "_buildfire.index.string1": this.ratingId,
      },
    };

    if (options && options.summary) {
      let stars = document.createElement("div");
      let averageRating = options.summary.total / options.summary.count;
      stars.appendChild(this.createStarsUI(averageRating, options.hideAverage))
      container.appendChild(stars);
    } else {
      Summaries.search(filters, (err, summaries) => {
        if (err) return console.error(err);
        if (!summaries || !summaries[0] || summaries[0].count === 0) {
          return container.innerHTML = "This item has not been rated yet"
        }
        let stars = document.createElement("div");
        let averageRating = summaries[0].total / summaries[0].count;
        stars.appendChild(this.createStarsUI(averageRating, options && options.hideAverage))
        container.appendChild(stars);
      })
    }

  }

  createStarsUI(averageRating, hideAverage) {
    let stars = document.createElement("div");
    stars.className = "rating-user-stars";

    for (let i = 1; i < 6; i++) {
      let star = document.createElement("span");
      console.log(i, Math.trunc(averageRating));
      if (i <= averageRating) {
        star.innerText = this.fullStar
      } else if (i === Math.trunc(averageRating) + 1) {
        let percentage = (averageRating - Math.trunc(averageRating)) * 100;
        console.log(percentage);
        star.innerText = this.emptyStar;
        star.style.position = "relative";
        let otherHalf = document.createElement("span");
        otherHalf.innerText = this.fullStar;
        otherHalf.className = "half-star";
        otherHalf.style.backgroundImage = `linear-gradient(to right, currentColor ${percentage}%, transparent ${percentage}%)`;
        star.appendChild(otherHalf);
      } else {
        star.innerText = this.emptyStar;
      }
      stars.appendChild(star);
    }
    if (!hideAverage) {
      let averageRatingSpan = document.createElement("span");
      averageRatingSpan.className = "average-rating"
      averageRatingSpan.innerText = averageRating.toFixed(2);

      stars.appendChild(averageRatingSpan);
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
        "_buildfire.index.string1": this.ratingId,
        "_buildfire.index.number1": 1
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
        "_buildfire.index.string1": this.ratingId
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

  addControlsToRating(ratingElement) {
    let rating = JSON.parse(ratingElement.dataset.rating);
    rating = new Rating({ data: rating, id: rating.id })

    if (!rating.isActive) {
      let inActiveRating = document.createElement("div");
      inActiveRating.innerText = "This rating has been blocked";
      ratingElement.appendChild(inActiveRating)
    }

    let controls = document.createElement("div");

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
          console.log(e, data);
          if (e && e !== 2 || (data && data.selectedButton.key === "yes")) {
            Ratings.del(rating, (err, data) => {
              console.log(data.rating)
              let ratingElement = document.getElementById(data.rating.id);
              ratingElement.parentElement.removeChild(ratingElement)
            })
          }
        }
      );
    })

    let blockButton = document.createElement("button");
    blockButton.innerText = "Block";
    blockButton.className = "delete-button"
    blockButton.addEventListener("click", () => {
      buildfire.notifications.confirm(
        {
          title: "Are you sure you want to block this review?",
          message: "User will not be able to submit another review for this item",
          confirmButton: { text: "Yes", key: "yes", type: "danger" },
          cancelButton: { text: "No", key: "no", type: "default" }
        },
        function (e, data) {
          console.log(e, data);
          if (e && e !== 2 || (data && data.selectedButton.key === "yes")) {
            Ratings.softDel(rating, (err, data) => {
              console.log(data.rating)
              // let ratingElement = document.getElementById(data.rating.id);
              // ratingElement.parentElement.removeChild(ratingElement)
            })
          }
        }
      );
    })
    controls.appendChild(deleteButton)
    controls.appendChild(blockButton)

    ratingElement.appendChild(controls)
  }

  createRatingUI(rating) {
    let container = document.createElement("div");
    container.className = "ratings-screen-rating";
    container.id = rating.id;
    container.dataset.rating = JSON.stringify(rating);

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
    ratingReviewText.innerText = rating.comment.length > 120 ? rating.comment.slice(0, 120) + "..." : rating.comment;
    if (rating.comment.length > 120) {
      let seeMore = document.createElement("a");
      seeMore.innerText = "see more"
      seeMore.addEventListener("click", () => {
        ratingReviewText.innerText = rating.comment
      })
      ratingReviewText.append(seeMore)
    }
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
    if (!addRatingScreen) return buildfire.navigation.restoreBackButtonClick();;

    document.body.removeChild(addRatingScreen);
    buildfire.navigation.restoreBackButtonClick();

  }

  openAddRatingScreen(callback) {
    buildfire.auth.getCurrentUser((err, loggedInUser) => {
      if (err || !loggedInUser) throw new Error("User not logged in")

      Ratings.findRatingByUser(this.ratingId, loggedInUser._id, (err, rating) => {
        buildfire.navigation.onBackButtonClick = () => {
          this.closeAddRatingScreen();
          buildfire.navigation.restoreBackButtonClick();
        }
        if (rating && !rating.isActive) {
          let container = document.createElement("div");
          container.className = "add-rating-screen";
          container.style.padding = "10px";
          container.innerText = "Your rating has been removed for violating community guildelines"
          return document.body.appendChild(container);
        }
        let originalRating;
        if (!rating) {
          rating = new Rating({
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
        } else {
          originalRating = new Rating({
            data: rating
          })
        }

        let container = document.createElement("div");
        container.className = "add-rating-screen";

        let image = document.createElement("img");
        image.className = "user-profile-image";
        image.src = buildfire.imageLib.resizeImage(loggedInUser.imageUrl, {
          size: "s",
          aspect: "1:1",
        });

        let heading4 = document.createElement("h4");
        heading4.innerText = rating.id ? "Update your rating" : "Rate and review";

        let heading5 = document.createElement("h5");
        heading5.innerText = "Share your experience to help others";

        let updateStarsUI = () => {
          for (let i = 0; i < 5; i++) {
            const star = document.getElementById("stars" + i);
            star.innerText = i < rating.rating ? this.fullStar : this.emptyStar;
          }
        }

        let ratingStars = document.createElement("div");
        ratingStars.className = "rating-stars";
        for (let i = 0; i < 5; i++) {
          let star = document.createElement("div");
          star.id = "stars" + i;
          star.addEventListener("click", function () {
            rating.rating = i + 1;
            updateStarsUI()
          });
          star.innerHTML = this.emptyStar;
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
              rating.comment = response.results[0].textValue;
              rating.images = [...rating.images, ...response.results[0].images];
              updateTextAreaUI();
              updateImagesUI();
            }
          );
        };

        let updateTextAreaUI = () => {
          textArea.innerText = rating.comment ? rating.comment : "Write a review...";
        }

        let textArea = document.createElement("div");
        textArea.className = "text-area";
        textArea.addEventListener("click", openTextDialog);

        let imagesContainer = document.createElement("images");
        imagesContainer.className = "review-images-container";

        const removeImage = (index) => {
          rating.images.splice(index, 1);
          updateImagesUI();
        };

        const updateImagesUI = () => {
          imagesContainer.innerHTML = "";
          rating.images.forEach((imageUrl, index) => {
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

        let submitButton = document.createElement("div");
        submitButton.className = "submit-button";
        submitButton.innerText = rating.id ? "Update Review" : "Submit Review";
        submitButton.addEventListener("click", () => {
          if (rating.id) {
            Ratings.set(originalRating, rating, (err, updatedRating) => {
              this.closeAddRatingScreen();
              callback(err, updatedRating)
            })
          } else {
            Ratings.add(rating, (err, addedRating) => {
              this.closeAddRatingScreen();
              callback(err, addedRating)
            })
          }
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

        updateImagesUI();
        updateStarsUI();
        updateTextAreaUI();
      });
    })
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



  static addRating(rating, callback) {
    const filters = {
      filter: {
        "_buildfire.index.string1": rating.ratingId
      }
    }
    buildfire.appData.search(filters, Summaries.TAG, (err, summaries) => {
      if (err) return callback(err);
      let summary = summaries[0]
      if (!summary) {
        summary = new Summary({
          data: {
            ratingId: rating.ratingId,
            count: 1,
            total: rating.rating
          }
        })
        buildfire.appData.insert(
          summary.toJSON(),
          Summaries.TAG,
          false,
          (err, record) => {
            if (err) return callback(err);
            return callback(null, new Summary(record));
          }
        );
      } else {
        summary = new Summary(summary);

        summary.count++;
        summary.total += rating.rating;

        buildfire.appData.update(
          summary.id,
          summary.toJSON(),
          Summaries.TAG,
          (err, record) => {
            if (err) return callback(err);
            return callback(null, new Summary(record));
          }
        );
      }

    })
  }

  static updateRating(originalRating, newRating, callback) {
    const filters = {
      filter: {
        "_buildfire.index.string1": newRating.ratingId
      }
    }
    buildfire.appData.search(filters, Summaries.TAG, (err, summaries) => {
      if (err) return callback(err);
      let summary = new Summary(summaries[0]);

      summary.total += newRating.rating;
      summary.total -= originalRating.rating;

      buildfire.appData.update(
        summary.id,
        summary.toJSON(),
        Summaries.TAG,
        (err, record) => {
          if (err) return callback(err);
          return callback(null, new Summary(record));
        }
      );
    })
  }

  static deleteRating(rating, callback) {
    const filters = {
      filter: {
        "_buildfire.index.string1": rating.ratingId
      }
    }
    buildfire.appData.search(filters, Summaries.TAG, (err, summaries) => {
      if (err) return callback(err);
      let summary = new Summary(summaries[0]);

      summary.total -= rating.rating;
      summary.count--;

      buildfire.appData.update(
        summary.id,
        summary.toJSON(),
        Summaries.TAG,
        (err, record) => {
          if (err) return callback(err);
          return callback(null, new Summary(record));
        }
      );
    })
  }
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

  static findRatingByUser(ratingId, userId, callback) {
    Ratings.search({
      filter: {
        "_buildfire.index.array1": userId,
        "_buildfire.index.string1": ratingId
      }
    }, (err, ratings) => {
      console.log({ err, ratings })
      if (err) return callback(err);
      return callback(null, ratings[0]);
    })
  }

  /**
   * Add new rating
   * @param {Rating} rating Instance of rating data class
   * @param {Function} callback Callback function
   */
  static add(rating, callback) {
    console.log("ADDING NEW RATING", rating);
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
            record = new Rating(record);

            Summaries.addRating(record, (err, data) => {
              return callback(null, { rating: record, summary: data });
            })

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
  static set(originalRating, rating, callback) {
    console.log("Updateing", originalRating, rating)
    if (!(rating instanceof Rating))
      return callback(new Error("Only Rating instance can be used"));

    rating.lastUpdatedOn = new Date();

    buildfire.appData.update(
      rating.id,
      rating.toJSON(),
      Ratings.TAG,
      (err, record) => {
        if (err) return callback(err);
        record = new Rating(record);
        Summaries.updateRating(originalRating, record, (err, data) => {
          return callback(null, { rating: record, summary: data });
        })
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

    buildfire.appData.delete(
      rating.id,
      Ratings.TAG,
      (err, record) => {
        if (err) return callback(err);
        Summaries.deleteRating(rating, (err, data) => {
          return callback(null, { rating, summary: data });
        })
      }
    );
  }

  /**
   * Soft delete single rating instance
   * @param {Rating} rating Instance of rating data class
   * @param {Function} callback Callback function
   */
  static softDel(rating, callback) {
    if (!(rating instanceof Rating))
      return callback(new Error("Only Rating instance can be used"));

    let shouldUpdateSummary = rating.isActive;

    rating.isActive = false;

    buildfire.appData.update(
      rating.id,
      rating.toJSON(),
      Ratings.TAG,
      (err, record) => {
        if (err) return callback(err);
        if (!shouldUpdateSummary) return callback(null, rating);

        Summaries.deleteRating(rating, (err, data) => {
          return callback(null, rating);
        })

      }
    );
  }
}

buildfire.components.ratingSystem = {
  stars: Stars,
  reviews: Reviews,
};
