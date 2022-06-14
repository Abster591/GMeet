const express = require("express");
const router = express.Router();
const passport = require("passport");

require("./auth.js");

router.get(
  "/google",
  passport.authenticate("google", { scope: ["email", "profile"] })
);

router.get(
  "/google/callback",
  passport.authenticate("google", {
    successRedirect: "/",
    failureRedirect: "/error",
  })
);

router.get("/logout", (req, res) => {
  req.logout(function (err) {
    if (err) {
      console.log(err);
      res.redirect("/error");
    }
    res.redirect("/");
  });
});

module.exports = router;
