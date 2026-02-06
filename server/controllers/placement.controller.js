import { prisma } from "../config/db.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponsive } from "../utils/ApiResponsive.js";

export const getActivePlacements = asyncHandler(async (req, res) => {
  const list = await prisma.placement.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
  });
  return res.status(200).json(new ApiResponsive(200, list, "Placements fetched"));
});

export const getAllPlacements = asyncHandler(async (req, res) => {
  const list = await prisma.placement.findMany({
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
  });
  return res.status(200).json(new ApiResponsive(200, list, "Placements fetched"));
});

export const createPlacement = asyncHandler(async (req, res) => {
  const { name, company, designation, sortOrder, isActive } = req.body;
  const item = await prisma.placement.create({
    data: {
      name: name || "",
      company: company || "",
      designation: designation || "",
      sortOrder: Number(sortOrder) ?? 0,
      isActive: isActive !== false,
    },
  });
  return res.status(201).json(new ApiResponsive(201, item, "Placement created"));
});

export const updatePlacement = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, company, designation, sortOrder, isActive } = req.body;
  const data = {};
  if (name !== undefined) data.name = name;
  if (company !== undefined) data.company = company;
  if (designation !== undefined) data.designation = designation;
  if (sortOrder !== undefined) data.sortOrder = Number(sortOrder);
  if (isActive !== undefined) data.isActive = Boolean(isActive);
  const item = await prisma.placement.update({ where: { id }, data });
  return res.status(200).json(new ApiResponsive(200, item, "Placement updated"));
});

export const deletePlacement = asyncHandler(async (req, res) => {
  const { id } = req.params;
  await prisma.placement.delete({ where: { id } });
  return res.status(200).json(new ApiResponsive(200, null, "Placement deleted"));
});
