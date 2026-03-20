
import api from "../../utils/api";

const Authfunction = async (user) => {
    try {
        await api.post("/auth", user);
    } catch (error) {
        console.error("Auth Error:", error);
    }
}

export default Authfunction;