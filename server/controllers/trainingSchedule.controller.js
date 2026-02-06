import { prisma } from "../config/db.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponsive } from "../utils/ApiResponsive.js";

export const getUpcomingSchedules = asyncHandler(async (req, res) => {
  const now = new Date();
  const { trainingType, search } = req.query;
  // No date (scheduledAt null) = always show; with date = only future
  const where = {
    isActive: true,
    OR: [
      { scheduledAt: null },
      { scheduledAt: { gte: now } },
    ],
  };
  if (trainingType && String(trainingType).trim()) {
    where.trainingType = String(trainingType).trim();
  }
  if (search && String(search).trim()) {
    where.AND = [
      ...(where.AND || []),
      {
        OR: [
          { title: { contains: String(search).trim(), mode: "insensitive" } },
          { topic: { contains: String(search).trim(), mode: "insensitive" } },
        ],
      },
    ];
  }
  const list = await prisma.trainingSchedule.findMany({
    where,
    orderBy: [
      { scheduledAt: "asc" }, // nulls first in PostgreSQL for asc
      { sortOrder: "asc" },
    ],
    take: 50,
  });
  // Sort so null scheduledAt (no date) appear first, then by date
  list.sort((a, b) => {
    if (!a.scheduledAt && !b.scheduledAt) return (a.sortOrder || 0) - (b.sortOrder || 0);
    if (!a.scheduledAt) return -1;
    if (!b.scheduledAt) return 1;
    return new Date(a.scheduledAt) - new Date(b.scheduledAt);
  });
  return res.status(200).json(new ApiResponsive(200, list, "Schedules fetched"));
});

export const getAllSchedules = asyncHandler(async (req, res) => {
  const { trainingType, search } = req.query;
  const where = {};
  if (trainingType && String(trainingType).trim()) {
    where.trainingType = String(trainingType).trim();
  }
  if (search && String(search).trim()) {
    where.OR = [
      { title: { contains: String(search).trim(), mode: "insensitive" } },
      { topic: { contains: String(search).trim(), mode: "insensitive" } },
    ];
  }
  const list = await prisma.trainingSchedule.findMany({
    where: Object.keys(where).length ? where : undefined,
    orderBy: [{ scheduledAt: "asc" }, { sortOrder: "asc" }],
  });
  return res.status(200).json(new ApiResponsive(200, list, "Schedules fetched"));
});

export const createSchedule = asyncHandler(async (req, res) => {
  const {
    title, topic, scheduledAt, durationMinutes, description,
    registrationUrl, meetLink, whatsappLink, trainingType, isActive, sortOrder,
  } = req.body;
  const item = await prisma.trainingSchedule.create({
    data: {
      title: title || "",
      topic: topic || null,
      scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
      durationMinutes: durationMinutes ?? 60,
      description: description || null,
      registrationUrl: registrationUrl || null,
      meetLink: meetLink || null,
      whatsappLink: whatsappLink || null,
      trainingType: trainingType || null,
      isActive: isActive !== false,
      sortOrder: Number(sortOrder) ?? 0,
    },
  });
  return res.status(201).json(new ApiResponsive(201, item, "Schedule created"));
});

export const updateSchedule = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const {
    title, topic, scheduledAt, durationMinutes, description,
    registrationUrl, meetLink, whatsappLink, trainingType, isActive, sortOrder,
  } = req.body;
  const data = {};
  if (title !== undefined) data.title = title;
  if (topic !== undefined) data.topic = topic;
  if (scheduledAt !== undefined) data.scheduledAt = scheduledAt ? new Date(scheduledAt) : null;
  if (durationMinutes !== undefined) data.durationMinutes = Number(durationMinutes);
  if (description !== undefined) data.description = description;
  if (registrationUrl !== undefined) data.registrationUrl = registrationUrl;
  if (meetLink !== undefined) data.meetLink = meetLink || null;
  if (whatsappLink !== undefined) data.whatsappLink = whatsappLink || null;
  if (trainingType !== undefined) data.trainingType = trainingType || null;
  if (isActive !== undefined) data.isActive = Boolean(isActive);
  if (sortOrder !== undefined) data.sortOrder = Number(sortOrder);
  const item = await prisma.trainingSchedule.update({ where: { id }, data });
  return res.status(200).json(new ApiResponsive(200, item, "Schedule updated"));
});

export const deleteSchedule = asyncHandler(async (req, res) => {
  const { id } = req.params;
  await prisma.trainingSchedule.delete({ where: { id } });
  return res.status(200).json(new ApiResponsive(200, null, "Schedule deleted"));
});
