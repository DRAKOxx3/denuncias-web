import bcrypt from 'bcrypt';
import { signToken } from '../middleware/auth.js';
import { prisma } from '../lib/prisma.js';

const sanitizeUser = ({ passwordHash, ...rest }) => rest;

export const listUsers = async (_req, res) => {
  try {
    const users = await prisma.user.findMany();
    return res.json(users.map(sanitizeUser));
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Error al listar usuarios.' });
  }
};

export const createUser = async (req, res) => {
  const { nombre, email, password, rol } = req.body || {};
  if (!nombre || !email || !password || !rol) {
    return res.status(400).json({ message: 'Nombre, email, password y rol son obligatorios.' });
  }

  try {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(409).json({ message: 'Ya existe un usuario con ese email.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { name: nombre, email, passwordHash, role: rol }
    });

    return res.status(201).json(sanitizeUser(user));
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Error al crear usuario.' });
  }
};

export const updateUser = async (req, res) => {
  const userId = Number(req.params.id);
  const updates = req.body || {};

  try {
    const existing = await prisma.user.findUnique({ where: { id: userId } });
    if (!existing) return res.status(404).json({ message: 'Usuario no encontrado' });

    const data = {};
    if (updates.nombre) data.name = updates.nombre;
    if (updates.email) data.email = updates.email;
    if (updates.rol) data.role = updates.rol;
    if (updates.password) data.passwordHash = await bcrypt.hash(updates.password, 10);

    const updated = await prisma.user.update({ where: { id: userId }, data });
    return res.json(sanitizeUser(updated));
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Error al actualizar usuario.' });
  }
};

export const deleteUser = async (req, res) => {
  const userId = Number(req.params.id);

  try {
    const existing = await prisma.user.findUnique({ where: { id: userId } });
    if (!existing) return res.status(404).json({ message: 'Usuario no encontrado' });

    await prisma.user.delete({ where: { id: userId } });
    return res.status(204).send();
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Error al eliminar usuario.' });
  }
};

export const login = async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ message: 'Email y contraseña son obligatorios.' });
  }

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }

    const passwordValid = await bcrypt.compare(password, user.passwordHash);
    if (!passwordValid) {
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }

    const token = signToken({ id: user.id, email: user.email, role: user.role });
    return res.json({ token, user: sanitizeUser(user) });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Error al iniciar sesión.' });
  }
};
