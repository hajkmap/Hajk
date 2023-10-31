# The AudioGuide plugin

TBA

## Requirements

### The database

Create these two tables in your spatial database:

#### audioguide_line

```sql
-- Table: public.audioguide_line

-- DROP TABLE IF EXISTS public.audioguide_line;

CREATE TABLE IF NOT EXISTS public.audioguide_line
(
    id integer PRIMARY KEY NOT NULL GENERATED ALWAYS AS IDENTITY ,
    "guideId" smallint NOT NULL,
    title text COLLATE pg_catalog."default" NOT NULL,
    text text COLLATE pg_catalog."default" NOT NULL,
    categories text COLLATE pg_catalog."default",
    images text COLLATE pg_catalog."default",
    length text COLLATE pg_catalog."default" NOT NULL DEFAULT 0,
    geom geometry(LineString,3008) NOT NULL,
    CONSTRAINT audioguide_line_pkey PRIMARY KEY (id)
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS public.audioguide_line
    OWNER to geoserver;
-- Index: sidx_audioguide_line_geom

-- DROP INDEX IF EXISTS public.sidx_audioguide_line_geom;

CREATE INDEX IF NOT EXISTS sidx_audioguide_line_geom
    ON public.audioguide_line USING gist
    (geom)
    TABLESPACE pg_default;
```

#### audioguide_point

```sql
-- Table: public.audioguide_point

-- DROP TABLE IF EXISTS public.audioguide_point;

CREATE TABLE IF NOT EXISTS public.audioguide_point
(
    id integer PRIMARY KEY NOT NULL GENERATED ALWAYS AS IDENTITY,
    "guideId" smallint NOT NULL,
    "stopNumber" smallint NOT NULL,
    title text COLLATE pg_catalog."default" NOT NULL,
    text text COLLATE pg_catalog."default" NOT NULL,
    images text COLLATE pg_catalog."default",
    audios text COLLATE pg_catalog."default",
    videos text COLLATE pg_catalog."default",
    geom geometry(Point,3008) NOT NULL,
    CONSTRAINT audioguide_point_pkey PRIMARY KEY (id)
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS public.audioguide_point
    OWNER to geoserver;
-- Index: sidx_audioguide_point_geom

-- DROP INDEX IF EXISTS public.sidx_audioguide_point_geom;

CREATE INDEX IF NOT EXISTS sidx_audioguide_point_geom
    ON public.audioguide_point USING gist
    (geom)
    TABLESPACE pg_default;
```

#### The OGC WFS Service

Publish the tables described above using a WFS service can output features as `application/json`.

Ensure to note the _workspace_, workspace's _namespace_, layers' _SRS_ as well the _URL_ to the WFS service.

### Example configuration

```jsonc
{
      "type": "audioguide",
      "index": 0,
      "options": {
        "serviceSettings": {
          "url": "http://localhost:8080/geoserver/ows", // URL to WFS service
          "srsName": "EPSG:3008", // SRS
          "featureNS": "https://pg.halmstad.se", // Workspace's namespace
          "featurePrefix": "pg" // Workspace name
        },
        "target": "left",
        "position": "right",
        "visibleAtStart": true,
        "visibleForGroups": []
      }
    },
```
