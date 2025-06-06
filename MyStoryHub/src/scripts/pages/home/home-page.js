import {
  generateLoaderAbsoluteTemplate,
  generateStoryItemTemplate,
  generateStoriesListEmptyTemplate,
  generateStoriesListErrorTemplate,
} from "../../template";
import HomePresenter from "./home-presenter";
import Map from "../../utils/map";
import * as StoryAPI from "../../data/api";

export default class HomePage {
  #presenter = null;
  #map = null;

  async render() {
    const greeting = this.#getGreeting();

    return `
      <section class="home-welcome-section">
        <div class="container">
          <div class="home-welcome-content">
            <h1 class="home-greeting"><center>${greeting}</h1></center>
        </div>
      </section>
      
      <div class="diamond-divider"></div>
      <section class="container stories-section" id="stories-section">
        <div class="stories-list__container">
          <div id="stories-list"></div>
          <div id="stories-list-loading-container"></div>
        </div>
      </section>
      
      <section class="map-section" id="map-section">
        <div class="container">
          <h4 class="section-title">Pick Your Locations</h4>
        </div>
        <div class="stories-list__map__container">
          <div id="map" class="stories-list__map"></div>
          <div id="map-loading-container"></div>
        </div>
      </section>
    `;
  }

  async afterRender() {
    this.#presenter = new HomePresenter({
      view: this,
      model: StoryAPI,
    });

    await this.#presenter.initialGalleryAndMap();

    document.getElementById("map-section").style.display = "none";

    const visibleSkipButton = document.getElementById("visible-skip-button");
    if (visibleSkipButton) {
      visibleSkipButton.addEventListener("click", () => {
        const storiesSection = document.getElementById("stories-section");
        if (storiesSection) {
          storiesSection.scrollIntoView({ behavior: "smooth" });
          storiesSection.focus();
        }
      });
    }
  }

  #getGreeting() {
    const hour = new Date().getHours();
    if (hour >= 6 && hour < 12) {
      return "Haii Good Morning!";
    } else if (hour >= 12 && hour < 18) {
      return "Haii Good Afternoon!";
    } else {
      return "Haii Good Evening!";
    }
  }

  populateStoriesList(message, stories) {
    if (stories.length <= 0) {
      this.populateStoriesListEmpty();
      return;
    }

    const html = stories.reduce((accumulator, story) => {
      if (
        !story.location &&
        (story.lat !== undefined || story.lon !== undefined)
      ) {
        story.location = {
          lat: story.lat,
          lon: story.lon,
        };
      } else if (!story.location) {
        story.location = { lat: 0, lon: 0 };
      }

      return accumulator.concat(
        generateStoryItemTemplate({
          ...story,
          name: story.name,
        })
      );
    }, "");

    document.getElementById("stories-list").innerHTML = `
      <div class="stories-list">${html}</div>
    `;
  }

  populateStoriesListEmpty() {
    document.getElementById("stories-list").innerHTML =
      generateStoriesListEmptyTemplate();
  }

  populateStoriesListError(message) {
    document.getElementById("stories-list").innerHTML =
      generateStoriesListErrorTemplate(message);
  }

  async initialMap() {
    try {
      this.#map = await Map.build("#map", {
        zoom: 10,
        locate: true,
      });

      if (this.#map) {
        const response = await StoryAPI.getAllStories();
        if (
          response.ok &&
          response.listStory &&
          response.listStory.length > 0
        ) {
          for (const story of response.listStory) {
            if (
              story.location ||
              (story.lat !== undefined && story.lon !== undefined)
            ) {
              const lat = story.location ? story.location.lat : story.lat;
              const lon = story.location ? story.location.lon : story.lon;

              if (
                (lat !== 0 || lon !== 0) &&
                !isNaN(Number(lat)) &&
                !isNaN(Number(lon))
              ) {
                const popupContent = `
                  <div class="story-location-popup">
                    <strong>${story.name}'s Story</strong>
                    <p>${story.description.substring(0, 100)}${
                  story.description.length > 100 ? "..." : ""
                }</p>
                    <p class="story-location-coordinates">
                      Latitude: ${lat}<br>
                      Longitude: ${lon}
                    </p>
                    <a href="#/stories/${
                      story.id
                    }" class="popup-link">Read and More</a>
                  </div>
                `;

                this.#map.addMarker(
                  [lat, lon],
                  { alt: `${story.name}'s story location` },
                  { content: popupContent }
                );
              }
            }
          }
        }
      }
    } catch (error) {
      console.error("Error initializing map:", error);
    }
  }

  showMapLoading() {
    document.getElementById("map-loading-container").innerHTML =
      generateLoaderAbsoluteTemplate();
  }

  hideMapLoading() {
    document.getElementById("map-loading-container").innerHTML = "";
  }

  showLoading() {
    document.getElementById("stories-list-loading-container").innerHTML =
      generateLoaderAbsoluteTemplate();
  }

  hideLoading() {
    document.getElementById("stories-list-loading-container").innerHTML = "";
  }
}
