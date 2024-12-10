import React, { useState, useEffect } from 'react';

const AdminPage = () => {
  const [users, setUsers] = useState([]);
  const [newUser, setNewUser] = useState({ email: '', password: '', role: 'user' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Fetch all users from the server
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await fetch('http://localhost:5001/users', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('authToken')}`,
          },
        });
        const data = await response.json();
        if (response.ok) {
          setUsers(data);
        } else {
          setError(data.message || 'Failed to fetch users.');
        }
      } catch (err) {
        setError('Server error. Please try again later.');
      }
    };

    fetchUsers();
  }, []);

  

  // Add a new user
  const handleAddUser = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const response = await fetch('http://localhost:5001/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('authToken')}`,
        },
        body: JSON.stringify(newUser),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess('User added successfully!');
        setUsers((prevUsers) => [...prevUsers, data]);
        setNewUser({ email: '', password: '', role: 'user' });
      } else {
        setError(data.message || 'Failed to add user.');
      }
    } catch (err) {
      setError('Server error. Please try again later.');
    }
  };

  // Update user role
  const handleUpdateRole = async (userId, newRole) => {
    setError('');
    setSuccess('');

    try {
      const response = await fetch(`http://localhost:5001/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('authToken')}`,
        },
        body: JSON.stringify({ role: newRole }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess('Role updated successfully!');
        setUsers((prevUsers) =>
          prevUsers.map((user) =>
            user.id === userId ? { ...user, role: newRole } : user
          )
        );
      } else {
        setError(data.message || 'Failed to update role.');
      }
    } catch (err) {
      setError('Server error. Please try again later.');
    }
  };

  // Delete user
  const handleDeleteUser = async (userId) => {
    setError('');
    setSuccess('');

    try {
      const response = await fetch(`http://localhost:5001/users/${userId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('authToken')}`,
        },
      });

      if (response.ok) {
        setSuccess('User deleted successfully!');
        setUsers((prevUsers) => prevUsers.filter((user) => user.id !== userId));
      } else {
        setError('Failed to delete user.');
      }
    } catch (err) {
      setError('Server error. Please try again later.');
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Admin Page</h2>
      {error && <div className="alert alert-danger">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {/* Add User Form */}
      <form onSubmit={handleAddUser} className="mb-4">
        <h3 className="text-lg font-bold">Add New User</h3>
        <div className="mb-2">
          <input
            type="email"
            placeholder="Email"
            value={newUser.email}
            onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
            required
            className="p-2 border rounded-md w-full"
          />
        </div>
        <div className="mb-2">
          <input
            type="password"
            placeholder="Password"
            value={newUser.password}
            onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
            required
            className="p-2 border rounded-md w-full"
          />
        </div>
        <div className="mb-2">
          <select
            value={newUser.role}
            onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
            className="p-2 border rounded-md w-full"
          >
            <option value="user">User</option>
            <option value="admin">Admin</option>
          </select>
        </div>
        <button type="submit" className="btn btn-primary">
          Add User
        </button>
      </form>

      {/* User List */}
      <h3 className="text-lg font-bold mb-2">User List</h3>
      <table className="min-w-full bg-white border rounded-md">
        <thead>
          <tr>
            <th className="px-4 py-2 border">Email</th>
            <th className="px-4 py-2 border">Role</th>
            <th className="px-4 py-2 border">Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id}>
              <td className="px-4 py-2 border">{user.email}</td>
              <td className="px-4 py-2 border">
                <select
                  value={user.role}
                  onChange={(e) => handleUpdateRole(user.id, e.target.value)}
                  className="p-2 border rounded-md"
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              </td>
              <td className="px-4 py-2 border">
                <button
                  onClick={() => handleDeleteUser(user.id)}
                  className="btn btn-danger"
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AdminPage;
