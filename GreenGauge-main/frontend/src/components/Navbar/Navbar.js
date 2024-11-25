// Navbar.js
import React from 'react';
import { Link } from 'react-router-dom';
import { useUser } from '../../context/UserContext/UserContext'; // Update path if necessary
import './Navbar.css'

const Navbar = () => {
    const { username } = useUser(); // Get the current username from context

    return (
        <nav className="navbar">
            <ul className="navbar-links">
                <li><Link to="/">Home</Link></li>
                {username ? (
                    <>
                        <li><Link to="/dashboard">Dashboard</Link></li>
                        <li><Link to="/logout">Logout</Link></li>
                        <li><Link to="/leaderboard">Leaderboard</Link></li>
                    </>
                ) : (
                    <>
                        <li><Link to="/login">Login</Link></li>
                        <li><Link to="/register">Register</Link></li>
                        <li><Link to="/leaderboard">Leaderboard</Link></li>
                    </>
                )}
            </ul>
        </nav>
    );
};

export default Navbar;
