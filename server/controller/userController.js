const userRepository = require('../repository/userRepository')

exports.getUserById = async (req, res) => {
    try {
        const user = await userRepository.getUserById(req.params.id)
        res.status(200).json(user)
    }catch(err) {
        console.error('Error in Controller:', err.message);
        res.status(500).json({ error: err.message });
    }
}
