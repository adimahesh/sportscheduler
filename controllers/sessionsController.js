const Session = require("../models/Session");
const Sport = require("../models/Sport");


exports.createSession = async (req, res) => {
  if (!req.session.user._id) return res.redirect("/auth/login");

  const { sport, teamA, teamB, additionalPlayers, date, venue } = req.body;
  const session = new Session({
    sport,
    teamA: teamA.split(",").map(p => p.trim()),
    teamB: teamB.split(",").map(p => p.trim()),
    additionalPlayers,
    date,
    venue,
    createdBy: req.session.user._id,
    participants: [req.session.user._id], // creator is participant
  });

  await session.save();
  res.redirect("/sessions");
};

exports.joinSession = async (req, res) => {
  if (!req.session.user) return res.redirect("/auth/login");

  const session = await Session.findById(req.params.id);
  if (!session) return res.send("Session not found");

  // prevent duplicate join
  const userId = req.session.user._id.toString(); // make sure comparison is string
  if (!session.participants.map(p => p.toString()).includes(userId)) {
    session.participants.push(userId);
    await session.save();
  }

  res.redirect("/sessions"); // redirect back to sessions page
};
exports.getSessionsPage = async (req, res) => {
  try {
    const sessions = await Session.find()
      .populate("sport")
      .populate("participants")
      .populate("createdBy")
      .lean();
    
    const sports = await Sport.find().lean(); // <-- fetch all sports

    res.render("sessions/index", {
      user: req.session.user,
      sessions,
      sports, // <-- pass sports to ejs
    });
  } catch (err) {
    console.error(err);
    res.send("Error loading sessions page");
  }
};

exports.cancelSession = async (req, res) => {
  const session = await Session.findById(req.params.id);
  if (!session) return res.send("Session not found");

  // Only creator can cancel
  if (session.createdBy.toString() !== req.session.user._id.toString()) {
    return res.send("Only the creator can cancel this session");
  }

  session.cancelled = true;
  session.cancelReason = req.body.reason;
  await session.save();

  res.redirect("/sessions");
};
