import React, { useReducer, useEffect, useCallback, useRef } from "react";
import { useParams } from "react-router-dom";
import styled from "styled-components";
import axios from "axios";

// Antd
import { Layout, Menu } from "antd";

// Local
import CreatePost from "components/CreatePost/CreatePost";
import filterOptions from "assets/data/filterOptions";
import FeedWrapper from "components/Feed/FeedWrapper";
import FilterBox from "components/Feed/FilterBox";
import FiltersSidebar from "components/Feed/FiltersSidebar";
import FiltersList from "components/Feed/FiltersList";
import Loader from "components/Feed/StyledLoader";
import Posts from "components/Feed/Posts";
import PostPage from "pages/PostPage";

import {
  optionsReducer,
  feedReducer,
  postsReducer,
  postsState,
} from "hooks/reducers/feedReducers";

// ICONS
import SvgIcon from "components/Icon/SvgIcon";
import creatPost from "assets/icons/create-post.svg";
import { ReactComponent as FiltersIcon } from "assets/icons/filters.svg";

// Constants
import { theme, mq } from "constants/theme";
import {
  ADD_OPTION,
  REMOVE_OPTION,
  REMOVE_ALL_OPTIONS,
  TOGGLE_STATE,
  SET_VALUE,
  SET_POSTS,
  FETCH_POSTS,
  ERROR_POSTS,
  NEXT_PAGE,
  RESET_PAGE,
  SET_LOADING,
  SET_LIKE,
} from "hooks/actions/feedActions";
import { LOGIN } from "templates/RouteWithSubRoutes";

const { black, darkerGray, royalBlue, white, offWhite } = theme.colors;

export const FeedContext = React.createContext();

const { Content, Sider } = Layout;

// feed types
const HELP_TYPE = {
  ALL: "All posts",
  REQUEST: "Requesting help",
  OFFER: "Offering help",
};

const initialState = {
  selectedType: "",
  initialLoad: true,
  showFilters: false,
  filterModal: false,
  createPostModal: false,
  applyFilters: false,
  activePanel: null,
  location: null,
};

const SiderWrapper = styled(Sider)`
  background-color: ${white};
  height: calc(100vh - 5rem);
  overflow-x: hidden;
  padding-top: 3.3rem;
  position: fixed;
  @media screen and (max-width: ${mq.phone.wide.maxWidth}) {
    display: none;
  }
`;

const FiltersWrapper = styled.div`
  border-top: 0.05rem solid rgba(0, 0, 0, 0.5);
  margin: 0 2rem;
  padding-top: 2rem;
  button {
    align-items: center;
    background-color: transparent;
    border: none;
    color: ${black};
    cursor: pointer;
    display: flex;
    font-family: ${theme.typography.font.family.display};
    font-size: ${theme.typography.size.large};
    font-weight: bold;
    margin-bottom: 1rem;
    padding: 0;
    span {
      align-items: center;
      border: 0.1rem solid ${royalBlue};
      border-radius: 50%;
      color: ${royalBlue};
      display: flex;
      height: 4.2rem;
      justify-content: center;
      margin-right: 1rem;
      width: 4.2rem;
      svg {
        fill: ${royalBlue};
        height: 2rem;
        width: 2rem;
      }
    }
  }
`;

const MenuWrapper = styled(Menu)`
  &.ant-menu {
    .ant-menu-item {
      border-left: 0.5rem solid ${white};
      color: ${darkerGray};
      font-size: ${theme.typography.size.large};
      &:hover {
        color: ${royalBlue};
      }
    }
    .ant-menu-item-selected {
      background-color: transparent;
      border-left: 0.5rem solid ${royalBlue};
      color: ${royalBlue};
      font-weight: bold;
    }
  }
`;

const LayoutWrapper = styled(Layout)`
  @media screen and (max-width: ${mq.phone.wide.maxWidth}) {
    background-color: ${white};
  }
  @media screen and (min-width: ${mq.tablet.narrow.minWidth}) {
    background-color: ${offWhite};
    min-height: calc(100vh - 5rem);
    .create-post,
    .filter-box {
      display: none;
    }
  }
`;

const ContentWrapper = styled(Content)`
  margin: 0 1rem;
  @media screen and (min-width: ${mq.tablet.narrow.minWidth}) {
    margin: 3.3rem 8.5rem 3.3rem calc(29rem + 8.5rem);
  }
`;

const HeaderWrapper = styled.div`
  display: none;
  h1 {
    font-size: ${theme.typography.heading.one};
    font-weight: bold;
    margin-top: 0;
  }
  button {
    align-items: center;
    background-color: transparent;
    border: none;
    color: ${black};
    cursor: pointer;
    display: flex;
    font-family: ${theme.typography.font.family.display};
    font-size: ${theme.typography.size.large};
    padding: 0;
    img {
      margin-left: 1.2rem;
      max-height: 4.2rem;
    }
  }
  @media screen and (min-width: ${mq.tablet.narrow.minWidth}) {
    display: flex;
    justify-content: space-between;
  }
`;

const Feed = (props) => {
  const { id } = useParams();
  const [feedState, feedDispatch] = useReducer(feedReducer, {
    ...initialState,
    createPostModal: id === "create-post",
  });
  const [selectedOptions, optionsDispatch] = useReducer(optionsReducer, {});
  const [posts, postsDispatch] = useReducer(postsReducer, postsState);

  const {
    filterModal,
    createPostModal,
    activePanel,
    location,
    selectedType,
    applyFilters,
    initialLoad,
    showFilters,
  } = feedState;

  const filters = Object.values(filterOptions);
  const {
    filterType,
    isLoading,
    loadMore,
    page,
    posts: postsList,
    status,
  } = posts;

  const { history, isAuthenticated, user } = props;
  let bottomBoundaryRef = useRef(null);

  const dispatchAction = (type, key, value) =>
    feedDispatch({ type, key, value });

  const handleFilterModal = () => {
    // method for mobile
    dispatchAction(TOGGLE_STATE, "filterModal");
    dispatchAction(SET_VALUE, "initialLoad", false);
    dispatchAction(SET_VALUE, "applyFilters", false);
    // dispatchAction(
    //   SET_VALUE,
    //   "activePanel",
    //   panelIdx > -1 ? `${panelIdx}` : null,
    // );
  };

  const handleQuit = (e) => {
    e.preventDefault();
    if (filterModal) {
      dispatchAction(TOGGLE_STATE, "filterModal");
    }

    if (showFilters) {
      dispatchAction(TOGGLE_STATE, "showFilters");
    }
    dispatchAction(SET_VALUE, "initialLoad", true);
    dispatchAction(SET_VALUE, "location", "");
    dispatchAction(SET_VALUE, "activePanel", null);
    postsDispatch({ type: RESET_PAGE, filterType: "" });
    optionsDispatch({ type: REMOVE_ALL_OPTIONS, payload: {} });
  };

  const handleLocation = (value) => {
    if (applyFilters) {
      postsDispatch({ type: RESET_PAGE, filterType: "" });
    }
    dispatchAction(SET_VALUE, "location", value);
  };

  const handleOption = (label, option) => (e) => {
    const options = selectedOptions[label] || [];
    const hasOption = options.includes(option);
    if (applyFilters) {
      postsDispatch({ type: RESET_PAGE, filterType: "" });
    }
    return optionsDispatch({
      type: hasOption ? REMOVE_OPTION : ADD_OPTION,
      payload: { option, label },
    });
  };

  const handleCreatePost = () => {
    if (isAuthenticated) {
      dispatchAction(TOGGLE_STATE, "createPostModal");
    } else {
      history.push(LOGIN);
    }
  };

  const handleChangeType = (e) => {
    const value = HELP_TYPE[e.key];
    if (selectedType !== value) {
      dispatchAction(SET_VALUE, "selectedType", value);
      postsDispatch({ type: RESET_PAGE, filterType: value });
    }
  };

  const handleShowFilters = (e) => {
    // desktop
    dispatchAction(TOGGLE_STATE, "showFilters");
    dispatchAction(SET_VALUE, "initialLoad", false);
    dispatchAction(SET_VALUE, "applyFilters", false);
  };

  const handleOnClose = () => {
    dispatchAction(SET_VALUE, "filterModal", false);
    dispatchAction(TOGGLE_STATE, "showFilters");
    postsDispatch({ type: RESET_PAGE, filterType: "" });
    dispatchAction(SET_VALUE, "applyFilters", true);
  };

  const handlePostLike = async (postId, liked) => {
    /* added here because userId not working */
    sessionStorage.removeItem("likePost");

    if (isAuthenticated) {
      const endPoint = `/api/posts/${postId}/likes/${user && user.id}`;
      let response = {};

      if (user) {
        if (liked) {
          try {
            response = await axios.delete(endPoint);
          } catch (error) {
            console.log({ error });
          }
        } else {
          try {
            response = await axios.put(endPoint);
          } catch (error) {
            console.log({ error });
          }
        }

        if (response.data) {
          postsDispatch({
            type: SET_LIKE,
            postId,
            count: response.data.likesCount,
          });
        }
      }
    } else {
      sessionStorage.setItem("likePost", postId);
      history.push(LOGIN);
    }
  };

  const loadPosts = useCallback(async () => {
    const objectiveURL = () => {
      let objective = selectedType;
      if (
        selectedOptions["need or give help"] &&
        selectedOptions["need or give help"].length < 2
      ) {
        objective =
          selectedOptions["need or give help"][0] === "Need Help"
            ? HELP_TYPE.REQUEST
            : HELP_TYPE.OFFER;
      }
      switch (objective) {
        case HELP_TYPE.REQUEST:
          return "&objective=request";
        case HELP_TYPE.OFFER:
          return "&objective=offer";
        default:
          return "";
      }
    };
    const filterURL = () => {
      const filterObj = { ...selectedOptions };
      delete filterObj["need or give help"];
      if (location) filterObj.location = location;
      return Object.keys(filterObj).length === 0
        ? ""
        : `&filter=${encodeURIComponent(JSON.stringify(filterObj))}`;
    };
    const limit = 5;
    const skip = page * limit;
    const baseURL = `/api/posts?limit=${limit}&skip=${skip}`;
    let endpoint = `${baseURL}${objectiveURL()}${filterURL()}`;
    let response = {};
    if (isLoading) {
      return;
    }

    await postsDispatch({ type: FETCH_POSTS });

    try {
      response = await axios.get(endpoint);
    } catch (error) {
      await postsDispatch({ type: ERROR_POSTS });
    }

    if (response && response.data && response.data.length) {
      const loadedPosts = response.data.reduce((obj, item) => {
        obj[item._id] = item;
        return obj;
      }, {});

      if (postsList) {
        await postsDispatch({
          type: SET_POSTS,
          posts: { ...postsList, ...loadedPosts },
        });
      } else {
        await postsDispatch({
          type: SET_POSTS,
          posts: { ...loadedPosts },
        });
      }
    } else if (response && response.data) {
      await postsDispatch({
        type: SET_POSTS,
        posts: { ...postsList },
      });
      await postsDispatch({
        type: SET_LOADING,
        isLoading: false,
        loadMore: false,
      });
    } else {
      await postsDispatch({ type: SET_LOADING });
    }
  }, [page, location, selectedOptions, selectedType, isLoading, postsList]);

  useEffect(() => {
    if (initialLoad || applyFilters) {
      loadPosts();
    }
  }, [location, page, filterType, selectedOptions, applyFilters]); // eslint-disable-line react-hooks/exhaustive-deps

  const scrollObserver = useCallback(
    (node) => {
      new IntersectionObserver((entries) => {
        entries.forEach(async (entry) => {
          if (entry.intersectionRatio > 0 && !isLoading && loadMore) {
            await postsDispatch({ type: NEXT_PAGE });
          }
        });
      }).observe(node);
    },
    [postsDispatch, loadMore, isLoading],
  );

  useEffect(() => {
    let observer;
    if (bottomBoundaryRef.current) {
      observer = scrollObserver(bottomBoundaryRef.current);
    }
    return () => {
      observer && observer.disconnect();
    };
  }, [scrollObserver, bottomBoundaryRef]);

  const postDelete = async (post) => {
    let deleterResponse;
    const endPoint = `/api/posts/${post._id}`;

    if (
      isAuthenticated &&
      user &&
      (user._id === post.author.id || user.id === post.author.id)
    ) {
      try {
        deleterResponse = await axios.delete(endPoint);
        if (deleterResponse && deleterResponse.data.success === true) {
          const allPosts = {
            ...postsList,
          };
          delete allPosts[post._id];

          await postsDispatch({
            type: SET_POSTS,
            posts: allPosts,
          });
        }
      } catch (error) {
        console.log({
          error,
        });
      }
    }
  };

  return (
    <FeedContext.Provider
      value={{
        filters,
        filterModal,
        activePanel,
        location,
        dispatchAction,
        selectedOptions,
        handleShowFilters,
        handleOption,
        handleFilterModal,
        handleQuit,
        handleLocation,
        handleOnClose,
        showFilters,
        handlePostLike,
      }}
    >
      <FeedWrapper>
        <LayoutWrapper>
          <SiderWrapper
            breakpoint="md"
            className="site-layout-background"
            width={290}
          >
            <div>
              <MenuWrapper
                defaultSelectedKeys={["ALL"]}
                onClick={handleChangeType}
              >
                {Object.keys(HELP_TYPE).map((item, index) => (
                  <Menu.Item key={item}>{HELP_TYPE[item]}</Menu.Item>
                ))}
              </MenuWrapper>
              <FiltersWrapper>
                <button onClick={handleShowFilters}>
                  <span>
                    <FiltersIcon />
                  </span>
                  Filters
                </button>
                <FiltersList />
              </FiltersWrapper>
            </div>
            <FiltersSidebar />
          </SiderWrapper>
          <ContentWrapper>
            <HeaderWrapper>
              <h1>Feed</h1>
              <button onClick={handleCreatePost}>
                Create a post
                <SvgIcon src={creatPost} />
              </button>
            </HeaderWrapper>
            <div>
              <FilterBox />
            </div>
            <Posts
              isAuthenticated={isAuthenticated}
              filteredPosts={postsList}
              handlePostLike={handlePostLike}
              loadPosts={loadPosts}
              postDelete={postDelete}
              user={user}
            />
            <PostPage
              handlePostLike={handlePostLike}
              user={user}
              isAuthenticated={isAuthenticated}
            />
            {status === ERROR_POSTS && <div>Something went wrong...</div>}
            {isLoading ? <Loader /> : <></>}
            <SvgIcon
              src={creatPost}
              onClick={handleCreatePost}
              className="create-post"
            />
          </ContentWrapper>
        </LayoutWrapper>
        <CreatePost
          onCancel={() => dispatchAction(TOGGLE_STATE, "createPostModal")}
          visible={createPostModal}
        />
        {!isLoading && <div id="list-bottom" ref={bottomBoundaryRef}></div>}
      </FeedWrapper>
    </FeedContext.Provider>
  );
};

export default Feed;
