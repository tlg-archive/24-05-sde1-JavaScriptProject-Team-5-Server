const express = require("express");
const Team = require("../models/TeamModel");
const UserModel = require("../models/User");

const router = express.Router();

//Team route handlers

//Post- Create team route
router.post("/createTeam", async (req, res) => {
  try {
    // Pull out data from body.
    const { teamName, userId } = req.body;
    // Save data to a variable
    const newTeam = new Team({
      teamName,
      owner: userId,
    });
    //save to DB- if successful return to client, if not return error
    try {
      const savedTeam = await newTeam.save();
      // Send back the new Team
      res.status(200).json(savedTeam);
      console.log(savedTeam);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Server error" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error saving team" });
  }
});
//Delete team route
router.delete("/deleteTeam", async (req, res) => {
  try {
    const { userId } = req.body;

    // Find the team by owner (userId)
    const myTeam = await Team.findOne({ owner: userId });

    // Send error if team doesn't exist
    if (!myTeam) {
      return res.status(404).json({ error: "Team not found in database" });
    }

    // Delete the team
    const result = await Team.deleteOne({ _id: myTeam._id });

    // If there isn't a Team to delete
    if (result.deletedCount === 0) {
      return res.status(404).json({ error: "Team not found in database" });
    }

    // Send success response if a team is deleted
    res.json({ message: "Team successfully deleted", result });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ error: "Server error deleting team", details: error.message });
  }
});


//Get team route
router.get("/myTeam", async (req, res) => {

  try {
    const { userId } = req.query;
    console.log("Received userId:", userId);

    if (!userId) {
      console.log("No userId provided");
      return res.status(400).json({ Error: "userId is required" });
    }

    console.log("Searching for team with owner:", userId);
    const myTeam = await Team.findOne({ owner: userId });

    if (!myTeam) {
      console.log("No team found for userId:", userId);
      return res.status(404).json({ Error: "Team not found" });
    }

    console.log("Team found:", myTeam);
    res.json(myTeam);
  } catch (error) {
    console.error("Server error getting Team:", error);
    res.status(500).json({ Error: "Server error getting Team", error: error.message });
  }
});

// Get all teams
router.get("/allTeams", async (req, res) => {
  try {
    const teams = await Team.find(); // Find all teams in the database
    res.status(200).json(teams); // Send the teams back to client
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching teams", error: error.message });
  }
});

// Follow a team
router.put("/followTeam", async (req, res) => {
  //followedTeam if the team _id
  const { userId, followedTeam } = req.body;

  try {
    // Update the user's followingTeams array to include the followed team
    await UserModel.findByIdAndUpdate(userId, {
      $addToSet: { following: followedTeam },
    });

    // Update the followed team's followers array
    await Team.findByIdAndUpdate(followedTeam, {
      $addToSet: { followers: userId },
    });

    res.status(200).json({ message: "Successfully followed the team" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error following team", error: error.message });
  }
});

// UnFollow a team
router.delete("/unFollowTeam", async (req, res) => {
  const { userId, unFollowedTeam } = req.body;

  try {
    // Remove the team from the user's followingTeams array
    await UserModel.findByIdAndUpdate(userId, {
      $pull: { following: unFollowedTeam },
    });

    // Remove the user from the team's followers array
    await Team.findByIdAndUpdate(unFollowedTeam, {
      $pull: { followers: userId },
    });

    res.status(200).json({ message: "Successfully un-followed team" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error un-following team", error: error.message });
  }
});

// Get teams you follow
router.get("/followedTeams", async (req, res) => {
  const { userId } = req.body;

  try {
    // Find the user and populate the following field to get the followed users
    const { userId } = req.body;
    const user = await UserModel.findById(userId);
    console.log(user);

    const teams = user.following;

    // Check if the user is following any teams
    if (!teams || teams.length === 0) {
      return res.status(200).json({ followedUsersTeams: [] });
    }
    // Find all teams owned by the followed users
    const followedUsersTeams = await Promise.all(
      teams.map((teamId) => Team.findById(teamId))
    );

    // Return the teams
    res.status(200).json({ followedUsersTeams });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      Error: "Error fetching followed users' teams",
      error: error.message,
    });
  }
});

module.exports = router;
