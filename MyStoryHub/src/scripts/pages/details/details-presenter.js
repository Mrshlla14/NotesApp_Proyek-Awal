import { storyMapper } from "../../data/api-mapper";
export default class DetailsPresenter {
  #storyId;
  #view;
  #apiModel;

  constructor(storyId, { view, apiModel }) {
    this.#storyId = storyId;
    this.#view = view;
    this.#apiModel = apiModel;
  }

  async showDetailsMap() {
    this.#view.showMapLoading();
    try {
      // Anda bisa menambahkan logika map di sini jika diperlukan
    } catch (error) {
      console.error("showDetailsMap: error:", error);
    } finally {
      this.#view.hideMapLoading();
    }
  }

  async showDetails() {
    this.#view.showDetailsLoading();
    try {
      const response = await this.#apiModel.getStoryById(this.#storyId);

      if (!response.ok) {
        console.error("showDetailsAndMap: response:", response);
        this.#view.populateDetailsError(response.message);
        return;
      }

      if (!response.story) {
        throw new Error("Story data not found");
      }

      console.log("API response story:", response.story);

      const storyData = { ...response.story };

      console.log(
        "Raw location data:",
        storyData.lat,
        storyData.lon,
        storyData.location
      );

      if (
        !storyData.location &&
        (storyData.lat !== undefined || storyData.lon !== undefined)
      ) {
        console.log("Creating location object from direct lat/lon properties");
        storyData.location = {
          lat: storyData.lat,
          lon: storyData.lon,
        };
      } else if (!storyData.location) {
        console.log("Story has no location data in API response");
        storyData.location = { lat: 0, lon: 0 };
      } else {
        console.log("Story location from API:", storyData.location);
      }

      const story = await storyMapper(storyData);
      console.log("Mapped story with location:", story.location);

      this.#view.populateDetailsAndInitialMap(response.message, story);
    } catch (error) {
      console.error("showDetailsAndMap: error:", error);
      this.#view.populateDetailsError(
        error.message || "Error loading story details"
      );
    } finally {
      this.#view.hideDetailsLoading();
    }
  }

  async getCommentsList() {
    this.#view.showCommentsLoading();
    try {
      const response = await this.#apiModel.getAllCommentsByStoryId(
        this.#storyId
      );
      this.#view.populateDetailsComments(
        response.message,
        response.comments || []
      );
    } catch (error) {
      console.error("getCommentsList: error:", error);
      this.#view.populateCommentsListError(error.message);
    } finally {
      this.#view.hideCommentsLoading();
    }
  }

  async postNewComment({ body }) {
    this.#view.showSubmitLoadingButton();
    try {
      const response = await this.#apiModel.storeNewCommentByStoryId(
        this.#storyId,
        { body }
      );

      if (!response.ok) {
        console.error("postNewComment: response:", response);
        this.#view.postNewCommentFailed(response.message);
        return;
      }

      this.#view.postNewCommentSuccessfully(response.message, response.data);
    } catch (error) {
      console.error("postNewComment: error:", error);
      this.#view.postNewCommentFailed(error.message);
    } finally {
      this.#view.hideSubmitLoadingButton();
    }
  }

  showSaveButton() {
    if (this.#isDetailsSaved()) {
      this.#view.renderRemoveButton();
      return;
    }

    this.#view.renderSaveButton();
  }

  #isDetailsSaved() {
    const { isStoryFavorite } = require("../../utils/profile");
    return isStoryFavorite(this.#storyId);
  }

  async toggleFavorite(story) {
    const {
      isStoryFavorite,
      addFavoriteStory,
      removeFavoriteStory,
    } = require("../../utils/profile");

    if (isStoryFavorite(this.#storyId)) {
      removeFavoriteStory(this.#storyId);
      this.#view.renderSaveButton();
      return false;
    } else {
      addFavoriteStory(story);
      this.#view.renderRemoveButton();
      return true;
    }
  }
}
