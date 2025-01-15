-- CreateEnum
CREATE TYPE "ServiceType" AS ENUM ('ARCGIS', 'VECTOR', 'WFS', 'WFST', 'WMS', 'WMTS');

-- CreateEnum
CREATE TYPE "ServerType" AS ENUM ('QGIS_SERVER', 'GEOSERVER');

-- CreateEnum
CREATE TYPE "UseType" AS ENUM ('BACKGROUND', 'FOREGROUND');

-- CreateEnum
CREATE TYPE "AuthStrategy" AS ENUM ('LOCAL', 'AZURE_AD', 'GITHUB');

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "sid" TEXT NOT NULL,
    "data" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LocalAccount" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "expires" TIMESTAMP(3),

    CONSTRAINT "LocalAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "strategy" "AuthStrategy" NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Role" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "title" TEXT,
    "description" TEXT,
    "systemCriticalRole" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RoleOnUser" (
    "userId" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,

    CONSTRAINT "RoleOnUser_pkey" PRIMARY KEY ("userId","roleId")
);

-- CreateTable
CREATE TABLE "RoleOnMap" (
    "mapId" INTEGER NOT NULL,
    "roleId" TEXT NOT NULL,

    CONSTRAINT "RoleOnMap_pkey" PRIMARY KEY ("mapId","roleId")
);

-- CreateTable
CREATE TABLE "RoleOnLayer" (
    "layerId" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,

    CONSTRAINT "RoleOnLayer_pkey" PRIMARY KEY ("layerId","roleId")
);

-- CreateTable
CREATE TABLE "RoleOnLayerInstance" (
    "layerInstanceId" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,

    CONSTRAINT "RoleOnLayerInstance_pkey" PRIMARY KEY ("layerInstanceId","roleId")
);

-- CreateTable
CREATE TABLE "RoleOnTool" (
    "toolId" INTEGER NOT NULL,
    "roleId" TEXT NOT NULL,

    CONSTRAINT "RoleOnTool_pkey" PRIMARY KEY ("toolId","roleId")
);

-- CreateTable
CREATE TABLE "RoleOnGroup" (
    "groupId" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,

    CONSTRAINT "RoleOnGroup_pkey" PRIMARY KEY ("groupId","roleId")
);

-- CreateTable
CREATE TABLE "Map" (
    "id" SERIAL NOT NULL,
    "locked" BOOLEAN NOT NULL DEFAULT false,
    "name" TEXT NOT NULL,
    "options" JSONB NOT NULL DEFAULT '{}',

    CONSTRAINT "Map_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tool" (
    "id" SERIAL NOT NULL,
    "locked" BOOLEAN NOT NULL DEFAULT false,
    "type" TEXT NOT NULL,
    "options" JSONB NOT NULL DEFAULT '{}',

    CONSTRAINT "Tool_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ToolsOnMaps" (
    "mapName" TEXT NOT NULL,
    "toolId" INTEGER NOT NULL,
    "index" INTEGER NOT NULL DEFAULT 0,
    "options" JSONB NOT NULL DEFAULT '{}',

    CONSTRAINT "ToolsOnMaps_pkey" PRIMARY KEY ("mapName","toolId")
);

-- CreateTable
CREATE TABLE "Projection" (
    "id" SERIAL NOT NULL,
    "locked" BOOLEAN NOT NULL DEFAULT false,
    "code" TEXT NOT NULL,
    "definition" TEXT NOT NULL,
    "extent" DECIMAL(65,30)[],
    "units" TEXT,

    CONSTRAINT "Projection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Group" (
    "id" TEXT NOT NULL,
    "locked" BOOLEAN NOT NULL DEFAULT false,
    "name" TEXT NOT NULL,

    CONSTRAINT "Group_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Service" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "locked" BOOLEAN NOT NULL DEFAULT false,
    "url" TEXT NOT NULL,
    "version" TEXT,
    "type" "ServiceType" NOT NULL,
    "serverType" "ServerType",
    "comment" TEXT,

    CONSTRAINT "Service_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Layer" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "locked" BOOLEAN NOT NULL DEFAULT false,
    "serviceId" TEXT NOT NULL,
    "options" JSONB NOT NULL DEFAULT '{}',

    CONSTRAINT "Layer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LayerInstance" (
    "id" TEXT NOT NULL,
    "layerId" TEXT NOT NULL,
    "mapId" INTEGER,
    "groupId" TEXT,
    "usage" "UseType" NOT NULL,
    "options" JSONB NOT NULL DEFAULT '{}',

    CONSTRAINT "LayerInstance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GroupsOnMaps" (
    "id" TEXT NOT NULL,
    "mapName" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "parentGroupId" TEXT,
    "usage" "UseType" NOT NULL,
    "name" TEXT NOT NULL,
    "toggled" BOOLEAN NOT NULL,
    "expanded" BOOLEAN NOT NULL,

    CONSTRAINT "GroupsOnMaps_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_MapToProjection" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_MapToProjection_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "Session_sid_key" ON "Session"("sid");

-- CreateIndex
CREATE UNIQUE INDEX "LocalAccount_userId_key" ON "LocalAccount"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "LocalAccount_email_key" ON "LocalAccount"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Role_code_key" ON "Role"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Map_name_key" ON "Map"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Projection_code_key" ON "Projection"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Service_url_type_key" ON "Service"("url", "type");

-- CreateIndex
CREATE INDEX "_MapToProjection_B_index" ON "_MapToProjection"("B");

-- AddForeignKey
ALTER TABLE "LocalAccount" ADD CONSTRAINT "LocalAccount_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoleOnUser" ADD CONSTRAINT "RoleOnUser_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoleOnUser" ADD CONSTRAINT "RoleOnUser_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoleOnMap" ADD CONSTRAINT "RoleOnMap_mapId_fkey" FOREIGN KEY ("mapId") REFERENCES "Map"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoleOnMap" ADD CONSTRAINT "RoleOnMap_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoleOnLayer" ADD CONSTRAINT "RoleOnLayer_layerId_fkey" FOREIGN KEY ("layerId") REFERENCES "Layer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoleOnLayer" ADD CONSTRAINT "RoleOnLayer_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoleOnLayerInstance" ADD CONSTRAINT "RoleOnLayerInstance_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoleOnLayerInstance" ADD CONSTRAINT "RoleOnLayerInstance_layerInstanceId_fkey" FOREIGN KEY ("layerInstanceId") REFERENCES "LayerInstance"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoleOnTool" ADD CONSTRAINT "RoleOnTool_toolId_fkey" FOREIGN KEY ("toolId") REFERENCES "Tool"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoleOnTool" ADD CONSTRAINT "RoleOnTool_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoleOnGroup" ADD CONSTRAINT "RoleOnGroup_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoleOnGroup" ADD CONSTRAINT "RoleOnGroup_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ToolsOnMaps" ADD CONSTRAINT "ToolsOnMaps_mapName_fkey" FOREIGN KEY ("mapName") REFERENCES "Map"("name") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ToolsOnMaps" ADD CONSTRAINT "ToolsOnMaps_toolId_fkey" FOREIGN KEY ("toolId") REFERENCES "Tool"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Layer" ADD CONSTRAINT "Layer_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LayerInstance" ADD CONSTRAINT "LayerInstance_layerId_fkey" FOREIGN KEY ("layerId") REFERENCES "Layer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LayerInstance" ADD CONSTRAINT "LayerInstance_mapId_fkey" FOREIGN KEY ("mapId") REFERENCES "Map"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LayerInstance" ADD CONSTRAINT "LayerInstance_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroupsOnMaps" ADD CONSTRAINT "GroupsOnMaps_mapName_fkey" FOREIGN KEY ("mapName") REFERENCES "Map"("name") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroupsOnMaps" ADD CONSTRAINT "GroupsOnMaps_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroupsOnMaps" ADD CONSTRAINT "GroupsOnMaps_parentGroupId_fkey" FOREIGN KEY ("parentGroupId") REFERENCES "GroupsOnMaps"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_MapToProjection" ADD CONSTRAINT "_MapToProjection_A_fkey" FOREIGN KEY ("A") REFERENCES "Map"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_MapToProjection" ADD CONSTRAINT "_MapToProjection_B_fkey" FOREIGN KEY ("B") REFERENCES "Projection"("id") ON DELETE CASCADE ON UPDATE CASCADE;
