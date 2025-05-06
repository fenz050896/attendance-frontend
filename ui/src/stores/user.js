const createUserSlice = (set) =>  ({
    user: null,
    token: null,
    setUser: (userPayload) => set(
        (state) => ({ user: { ...state.user, ...userPayload } })
    ),
    setToken: (token) => set(
        () => ({ token })
    ),
})

export default createUserSlice;
