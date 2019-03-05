require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const request = require("request");
const oauth = require("oauth");
const mongoose = require('mongoose');
const _ = require("lodash");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const findOrCreate = require("mongoose-findorcreate");


const app = express();
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(express.static("public"));



app.use(session({
  secret: "Our little secret.",
  resave: false,
  saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());


mongoose.connect("mongodb://localhost:27017/personalDB", {
  useNewUrlParser: true
})
const postSchema = {
  title: String,
  content: String
};

const userSchema = new mongoose.Schema({
  email: String,
  password: String,
  googleId: String,
});

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

const User = new mongoose.model("User", userSchema);
passport.use(User.createStrategy());

passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  User.findById(id, function(err, user) {
    done(err, user);
  })
});

const Post = mongoose.model("Post", postSchema);

app.get("/", function(req, res) {
  Post.find({}, function(err, posts) {
    res.render("home", {
      posts: posts
    });
  });
});

app.get("/auth/google",
  passport.authenticate("google", {
    scope: ["profile"]
  })
);

app.get("/auth/google/secrets",
  passport.authenticate("google", {
    failureRedirect: "/login"
  }),
  function(req, res) {
    res.redirect("/post")
  }
)

app.get("/secrets", function(req, res) {
  //only if authenticated and logged in then show
  //find all secret fields where not null
  User.find({
    "secret": {
      $ne: null
    }
  }, function(err, foundUsers) {
    if (err) {
      console.log(err);
    } else {
      if (foundUsers) {
        res.render("secrets", {
          usersWithSecrets: foundUsers
        });
      }
    }
  })
});

app.get("/compose", function(req, res) {
  if (req.isAuthenticated()) {
    res.render("post");
  } else {
    res.redirect("/login")
  }
});



app.get("/bmicalculator", function(req, res) {
  res.sendFile(__dirname + "/index.html");
});



app.get("/compose", function(req, res) {
  res.render("compose");
});

app.post("/compose", function(req, res) {
  const post = new Post({
    title: req.body.postTitle,
    content: req.body.postBody
  });
  post.save(function(err) {
    if (!err) {
      res.redirect("/post");
    }
  });
})

app.post("/login", function(req, res) {
  const user = new User({
    username: req.body.username,
    password: req.body.password
  })
  //passport function to login user
  req.login(user, function(err) {
    if (err) {
      console.log(err);
    } else {
      //passport authentication
      passport.authenticate("local")(req, res, function() {
        res.redirect("/post")
      });
    }
  })
});

app.post("/register", function(req, res) {
  //passport local mongoose
  User.register({
    username: req.body.username
  }, req.body.password, function(err, user) {
    if (err) {
      console.log(err);
      res.redirect("/register");
    } else {
      passport.authenticate("local")(req, res, function() {
        res.redirect("/post")
      })
    }
  })
});

app.get("/post", function(req, res) {
  Post.find({}, function(err, posts) {
    res.render("post", {
      posts: posts
    });
  })
});


app.post("/delete", function(req, res) {
  const checkedItemId = req.body.button;
  Post.findByIdAndRemove(checkedItemId, function(err) {
    if (!err) {
      console.log("Success");
      res.redirect("/post");
    } else {
      console.log("failure");
      res.redirect("/post");
    }
  });

})

app.get("/login", function(req, res) {
  res.render("login"); //renders home.ejs page
})

app.get("/register", function(req, res) {
      res.render("register"); //renders home.ejs page
    })


      app.get("/logout", function(req, res) {
        req.logout();
        res.redirect("/");
      })



      app.post("/bmicalculator", function(req, res) {
        var weight = Number(req.body.weight);
        var height = Number(req.body.height);
        var bmi = weight / Math.pow(height, 2);
        res.send("Your BMI is " + bmi);
      });




      app.listen(3000, function() {
        console.log("server is running on port 3000.");
      })
