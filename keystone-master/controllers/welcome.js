const welcome = (req, res) => {
    // req.flash('logoutMessage', 'logout successful')
    // let logged_out = req.query.logged_out || false;
    let showSuccess = false;

    if (req.query.logged_out === "true") {
        showSuccess = "You have logged out successfully";
    };

    res.render("../views/welcome/welcome", { showSuccess: showSuccess });
};

module.exports = welcome;