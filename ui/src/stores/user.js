const createUserSlice = (set) =>  ({
    user: null,
    token: null,
    contextOpened: false,
    hasRegisteredFaces: false,
    setUser: (userPayload) => set(
        (state) => ({ user: { ...state.user, ...userPayload } })
    ),
    setToken: (token) => set(
        () => ({ token })
    ),
    setContextOpened: (contextOpened) => set(
        () => ({ contextOpened })
    ),
    setHasRegisteredFaces: (hasRegisteredFaces) => set(
        () => ({ hasRegisteredFaces })
    ),
})

export default createUserSlice;
