import { initializeApp } from "https://www.gstatic.com/firebasejs/12.17.1/firebase-app.js";

import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js";

import {
  getFirestore,
  collection,
  addDoc,
  query,
  where,
  onSnapshot,
  serverTimestamp,
  doc,
  deleteDoc
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js";


// ===============================
// FIREBASE CONFIGURATION
// ===============================

const firebaseConfig = {
  apiKey: "AIzaSyCKvJW61EJriulGFBQ1vtAoi432yXe1b_s",
  authDomain: "twilights-sky.firebaseapp.com",
  projectId: "twilights-sky",
  storageBucket: "twilights-sky.firebasestorage.app",
  messagingSenderId: "763273050414",
  appId: "1:763273050414:web:0755b7b0e75aabf56f22bf"
};


// ===============================
// INITIALIZE FIREBASE
// ===============================

const app = initializeApp(firebaseConfig);

const auth = getAuth(app);
const db = getFirestore(app);

const provider = new GoogleAuthProvider();


// ===============================
// IDENTIFY CURRENT BLOG POST
// ===============================

// Use the last two path parts so the same article
// gets the same ID locally and on GitHub Pages.
//
// Local:
// /posts/cars-post-template.html
//
// GitHub Pages:
// /Twilights-Sky/posts/cars-post-template.html
//
// Both become:
// posts/cars-post-template.html

const pathParts = window.location.pathname
  .split("/")
  .filter(Boolean);

const postId = pathParts
  .slice(-2)
  .join("/");

console.log("Current post ID:", postId);


// ===============================
// HTML ELEMENTS
// ===============================

const googleSignIn = document.getElementById("googleSignIn");
const commentsLogin = document.getElementById("commentsLogin");
const commentsForm = document.getElementById("commentsForm");

const userPhoto = document.getElementById("userPhoto");
const userName = document.getElementById("userName");
const signOutButton = document.getElementById("signOut");

const commentText = document.getElementById("commentText");
const postComment = document.getElementById("postComment");

const commentsList = document.getElementById("commentsList");
const commentMessage = document.getElementById("commentMessage");
const characterCount = document.getElementById("characterCount");


// ===============================
// GOOGLE SIGN-IN
// ===============================

if (googleSignIn) {

  googleSignIn.addEventListener("click", async () => {

    try {

      commentMessage.textContent = "";

      await signInWithPopup(auth, provider);

    } catch (error) {

      console.error("Google sign-in error:", error);

      commentMessage.textContent =
        "Unable to sign in with Google. Please try again.";

    }

  });

}


// ===============================
// SIGN OUT
// ===============================

if (signOutButton) {

  signOutButton.addEventListener("click", async () => {

    try {

      await signOut(auth);

    } catch (error) {

      console.error("Sign-out error:", error);

    }

  });

}


// ===============================
// AUTHENTICATION STATE
// ===============================

onAuthStateChanged(auth, (user) => {

  if (user) {

    commentsLogin.hidden = true;

    commentsForm.hidden = false;

    userName.textContent =
      user.displayName || "Google User";

    userPhoto.src =
      user.photoURL || "";

    userPhoto.alt =
      user.displayName || "User";

  } else {

    commentsLogin.hidden = false;

    commentsForm.hidden = true;

    userName.textContent = "";

    userPhoto.src = "";

  }

});


// ===============================
// CHARACTER COUNTER
// ===============================

if (commentText && characterCount) {

  commentText.addEventListener("input", () => {

    characterCount.textContent =
      `${commentText.value.length} / 2000`;

  });

}


// ===============================
// POST COMMENT
// ===============================

if (postComment) {

  postComment.addEventListener("click", async () => {

    const user = auth.currentUser;

    const text = commentText.value.trim();


    if (!user) {

      commentMessage.textContent =
        "Please sign in with Google first.";

      return;

    }


    if (!text) {

      commentMessage.textContent =
        "Please write a comment.";

      return;

    }


    if (text.length > 2000) {

      commentMessage.textContent =
        "Your comment is too long.";

      return;

    }


    postComment.disabled = true;

    commentMessage.textContent = "Posting...";


    try {

      await addDoc(
        collection(db, "comments"),
        {

          uid: user.uid,

          name:
            user.displayName || "Google User",

          photoURL:
            user.photoURL || "",

          text: text,

          postId: postId,

          createdAt:
            serverTimestamp()

        }
      );


      commentText.value = "";

      characterCount.textContent =
        "0 / 2000";

      commentMessage.textContent =
        "Comment posted!";


    } catch (error) {

      console.error(
        "Comment posting error:",
        error
      );

      commentMessage.textContent =
        "Unable to post the comment. Please try again.";

    }


    postComment.disabled = false;

  });

}


// ===============================
// LOAD COMMENTS
// ===============================

// IMPORTANT:
// We only use "where" here.
//
// We intentionally do NOT use:
// orderBy("createdAt", "desc")
//
// That avoids requiring a Firestore composite index.

const commentsQuery = query(

  collection(db, "comments"),

  where(
    "postId",
    "==",
    postId
  )

);


// ===============================
// DISPLAY COMMENTS
// ===============================

onSnapshot(

  commentsQuery,

  (snapshot) => {

    commentsList.innerHTML = "";


    if (snapshot.empty) {

      commentsList.innerHTML =
        "<p>No comments yet. Be the first to share your thoughts! 💬</p>";

      return;

    }


    // Convert Firestore documents into an array
    const comments = snapshot.docs.map((commentDoc) => ({

      id: commentDoc.id,

      data: commentDoc.data()

    }));


    // Sort newest first
    comments.sort((a, b) => {

      const timeA =
        a.data.createdAt?.toMillis?.() || 0;

      const timeB =
        b.data.createdAt?.toMillis?.() || 0;

      return timeB - timeA;

    });


    // Display each comment
    comments.forEach(({ id, data: comment }) => {


      // Main comment container
      const commentElement =
        document.createElement("article");

      commentElement.className =
        "comment";


      // ===============================
      // COMMENT HEADER
      // ===============================

      const header =
        document.createElement("div");

      header.className =
        "comment-header";


      // Profile image
      if (comment.photoURL) {

        const image =
          document.createElement("img");

        image.className =
          "comment-avatar";

        image.src =
          comment.photoURL;

        image.alt = "";

        header.appendChild(image);

      }


      // User information
      const userInfo =
        document.createElement("div");


      const name =
        document.createElement("strong");

      name.textContent =
        comment.name || "Google User";


      const date =
        document.createElement("small");


      if (comment.createdAt) {

        date.textContent =
          comment.createdAt
            .toDate()
            .toLocaleString();

      } else {

        date.textContent =
          "Just now";

      }


      userInfo.appendChild(name);

      userInfo.appendChild(date);

      header.appendChild(userInfo);

      commentElement.appendChild(header);


      // ===============================
      // COMMENT TEXT
      // ===============================

      const text =
        document.createElement("p");

      text.className =
        "comment-text";

      text.textContent =
        comment.text || "";

      commentElement.appendChild(text);


      // ===============================
      // DELETE BUTTON
      // ===============================

      if (
        auth.currentUser &&
        auth.currentUser.uid === comment.uid
      ) {

        const actions =
          document.createElement("div");

        actions.className =
          "comment-actions";


        const deleteButton =
          document.createElement("button");

        deleteButton.type =
          "button";

        deleteButton.textContent =
          "Delete";


        deleteButton.addEventListener(
          "click",
          async () => {

            const confirmed =
              confirm(
                "Are you sure you want to delete this comment?"
              );


            if (!confirmed) {

              return;

            }


            try {

              await deleteDoc(
                doc(
                  db,
                  "comments",
                  id
                )
              );

            } catch (error) {

              console.error(
                "Delete error:",
                error
              );

            }

          }
        );


        actions.appendChild(
          deleteButton
        );

        commentElement.appendChild(
          actions
        );

      }


      commentsList.appendChild(
        commentElement
      );

    });

  },


  (error) => {

    console.error(
      "Comments loading error:",
      error
    );

    commentsList.innerHTML =
      "<p>Unable to load comments.</p>";

  }

);