export const isAuthenticated = () => {
    return localStorage.getItem('token') !== null;
};

export const getUserRole = () => {
    const userStr = localStorage.getItem('user');
    if (!userStr) return null;
    try {
        const user = JSON.parse(userStr);
        return user.role;
    } catch {
        return null;
    }
};
