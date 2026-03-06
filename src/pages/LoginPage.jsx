import { useState } from "react"
import { useNavigate } from "react-router-dom"

export default function LoginPage({ onLogin }) {
  const navigate = useNavigate()
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")

  function handleSubmit(event) {
    event.preventDefault()
    onLogin?.(username.trim())
    // Temporary client-side auth success until backend login/token flow is available.
    navigate("/game")
  }

  return (
    <div className="pageCenter">
      <section className="cardWide authCard">
        <h1 className="cardTitle authTitle">Login</h1>

        <form onSubmit={handleSubmit} className="authForm">
          <label className="authField">
            <span className="authLabel">Username</span>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="authInput"
              autoComplete="username"
              placeholder="Enter username"
              required
            />
          </label>

          <label className="authField">
            <span className="authLabel">Password</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="authInput"
              autoComplete="current-password"
              placeholder="Enter password"
              required
            />
          </label>

          <button className="primaryButton authButton" type="submit">Login</button>
        </form>
      </section>
    </div>
  )
}
