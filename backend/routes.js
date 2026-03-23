const express = require("express");
const {
  register,
  login,
  updateProfile,
  deleteProfile,
  jwtRequired,
  getUserInfo,
} = require("./controllers/authorization");
const {
  createExcursion,
  editExcursion,
  deleteExcursionById,
  getExcursionsForUser,
  joinExcursion,
} = require("./controllers/excursion");
const {
  getAllGeofences,
  createGeofence,
  deleteGeofenceById,
} = require("./controllers/geofences");

const {
  getAllLocations,
  saveUserLocation,
  setMainUser,
  startExcursion,
  endExcursion,
  leaveExcursion,
} = require("./controllers/locations");

const { getUsersActivity } = require("./controllers/excursion_members");

const {
  getAllQuestions,
  createQuestion,
  deleteQuestionById,
  editQuestion,
} = require("./controllers/questions");

const {
  getAllAnswers,
  createAnswer,
  deleteAnswerById,
  editAnswer,
} = require("./controllers/answers");

const { getQuiz, submitQuiz, hasQuiz } = require("./controllers/quiz");

const {
  getMyExcursionResults,
  getExcursionResultDetails,
  getAllExcursionResults,
  getExcursionUsersResults,
} = require("./controllers/results");

const router = express.Router();

router.post("/", register);
router.post("/login", login);
router.put("/editProfile", jwtRequired, updateProfile);
router.delete("/delete/profile/:id", jwtRequired, deleteProfile);
router.get("/user", jwtRequired, getUserInfo);

router.post("/excursions/create", jwtRequired, createExcursion);
router.get("/excursions/user/:userId", jwtRequired, getExcursionsForUser);
router.put("/excursions/edit", jwtRequired, editExcursion);
router.delete(
  "/excursions/delete/:excursionId",
  jwtRequired,
  deleteExcursionById,
);
router.post("/excursions/join", jwtRequired, joinExcursion);
router.post("/excursions/activity", getUsersActivity);

router.get("/all/geofences", getAllGeofences);
router.post("/save/geofence", createGeofence);
router.delete("/delete/geofence/:id", deleteGeofenceById);

router.post("/all/locations", getAllLocations);
router.post("/save/locations", saveUserLocation);
router.post("/set/main-user", setMainUser);
router.post("/start/excursion", startExcursion);
router.post("/end/excursion", endExcursion);
router.post("/leave/excursion", leaveExcursion);

router.get("/all/questions", getAllQuestions);
router.post("/questions/create", jwtRequired, createQuestion);
router.delete("/questions/delete/:id", jwtRequired, deleteQuestionById);
router.put("/questions/edit", jwtRequired, editQuestion);

router.get("/all/answers", getAllAnswers);
router.post("/answers/create", jwtRequired, createAnswer);
router.delete("/answers/delete/:id", jwtRequired, deleteAnswerById);
router.put("/answers/edit", jwtRequired, editAnswer);

router.get("/quiz", getQuiz);
router.post("/quiz/submit", submitQuiz);
router.get("/quiz/exists", hasQuiz);

router.get("/results", getMyExcursionResults);
router.get("/results/:excursionId", getExcursionResultDetails);
router.get("/all/results", getAllExcursionResults);
router.get("/all/results/:excursionId/users", getExcursionUsersResults);

module.exports = router;
