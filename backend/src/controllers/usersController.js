import bcrypt from 'bcrypt';
import { signToken } from '../middleware/auth.js';
import { addUser, db, deleteUserById, updateUserById } from '../data/store.js';

const sanitizeUser = ({ password_hash, ...rest }) => rest;

export const listUsers = async (_req, res) => {
  return res.json(db.users.map(sanitizeUser));
};

export const createUser = async (req, res) => {
  const { nombre, email, password, rol } = req.body || {};
  if (!nombre || !email || !password || !rol) {
    return res.status(400).json({ message: 'Nombre, email, password y rol son obligatorios.' });
  }

  if (db.users.some((u) => u.email.toLowerCase() === email.toLowerCase())) {
    return res.status(409).json({ message: 'Ya existe un usuario con ese email.' });
  }

  const user = addUser({ nombre, email, password, rol });
  return res.status(201).json(sanitizeUser(user));
};

export const updateUser = async (req, res) => {
  const userId = Number(req.params.id);
  const existing = db.users.find((u) => u.id === userId);
  if (!existing) return res.status(404).json({ message: 'Usuario no encontrado' });

  const updates = { ...req.body };
  if (updates.password) {
    updates.password_hash = await bcrypt.hash(updates.password, 10);
    delete updates.password;
  }

  const updated = updateUserById(userId, updates);
  return res.json(sanitizeUser(updated));
};

export const deleteUser = async (req, res) => {
  const userId = Number(req.params.id);
  const existing = db.users.find((u) => u.id === userId);
  if (!existing) return res.status(404).json({ message: 'Usuario no encontrado' });

  deleteUserById(userId);
  return res.status(204).send();
};

export const login = async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ message: 'Email y contraseña son obligatorios.' });
  }

  const user = db.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  if (!user) {
    return res.status(401).json({ message: 'Credenciales inválidas' });
  }

  const passwordValid = await bcrypt.compare(password, user.password_hash);
  if (!passwordValid) {
    return res.status(401).json({ message: 'Credenciales inválidas' });
  }

  const token = signToken({ id: user.id, email: user.email, role: user.rol });
  return res.json({ token, user: sanitizeUser(user) });
};
