import { useCallback, useEffect, useState } from "react"

import {
  fetchCurrentUser,
  fetchPlayerState,
  loginUser,
  signupUser,
} from "../services/api.js"
import { normalizeUsername } from "./appStateHelpers.js"

export function useAuthSession({
  authToken,
  setAuthToken,
  setIsAuthed,
  setPlayerUsername,
  applyLocalProgress,
  applyPlayerState,
}) {
  const [authReady, setAuthReady] = useState(false)
  const [progressReady, setProgressReady] = useState(false)

  const hydratePlayerState = useCallback(async (
    token,
    fallbackState = {},
    fallbackUsername = "Player"
  ) => {
    try {
      const playerStateResponse = await fetchPlayerState(token)
      setPlayerUsername(playerStateResponse.user.username || fallbackUsername)
      applyPlayerState(playerStateResponse.state)
      return true
    } catch {
      setPlayerUsername(fallbackUsername)
      applyPlayerState(fallbackState)
      return false
    }
  }, [applyPlayerState, setPlayerUsername])

  useEffect(() => {
    let isCancelled = false

    async function verifySession() {
      if (!authToken) {
        if (!isCancelled) {
          setIsAuthed(false)
          setProgressReady(true)
          setAuthReady(true)
        }
        return
      }

      try {
        const session = await fetchCurrentUser(authToken)
        if (isCancelled) return

        applyLocalProgress(session.progress)
        await hydratePlayerState(authToken, session.progress, session.user.username)
        if (isCancelled) return

        setIsAuthed(true)
        setProgressReady(true)
      } catch {
        if (isCancelled) return
        setAuthToken("")
        setIsAuthed(false)
        setProgressReady(true)
      } finally {
        if (!isCancelled) {
          setAuthReady(true)
        }
      }
    }

    verifySession()

    return () => {
      isCancelled = true
    }
  }, [
    applyLocalProgress,
    authToken,
    hydratePlayerState,
    setAuthToken,
    setIsAuthed,
  ])

  const handleLogin = useCallback(async (username = "", password = "") => {
    const normalizedUsername = normalizeUsername(username)

    if (!normalizedUsername || !password) {
      return {
        ok: false,
        error: "Enter your username and password.",
      }
    }

    try {
      const response = await loginUser({
        username: normalizedUsername,
        password,
      })

      applyLocalProgress(response.progress)
      await hydratePlayerState(response.token, response.progress, response.user.username)
      setAuthToken(response.token)
      setIsAuthed(true)
      setProgressReady(true)
      return { ok: true }
    } catch (error) {
      return {
        ok: false,
        error: error.message || "Unable to log in with those details.",
      }
    }
  }, [
    applyLocalProgress,
    hydratePlayerState,
    setAuthToken,
    setIsAuthed,
  ])

  const handleSignup = useCallback(async (username = "", password = "") => {
    const normalizedUsername = normalizeUsername(username) || "Player"

    try {
      const response = await signupUser({
        username: normalizedUsername,
        password,
      })

      applyLocalProgress(response.progress)
      await hydratePlayerState(response.token, response.progress, response.user.username)
      setAuthToken(response.token)
      setIsAuthed(true)
      setProgressReady(true)
      return { ok: true }
    } catch (error) {
      return {
        ok: false,
        error: error.message || "Unable to create account.",
      }
    }
  }, [
    applyLocalProgress,
    hydratePlayerState,
    setAuthToken,
    setIsAuthed,
  ])

  const handleLogout = useCallback(() => {
    setAuthToken("")
    setIsAuthed(false)
    setProgressReady(false)
  }, [setAuthToken, setIsAuthed])

  return {
    authReady,
    progressReady,
    handleLogin,
    handleSignup,
    handleLogout,
  }
}
