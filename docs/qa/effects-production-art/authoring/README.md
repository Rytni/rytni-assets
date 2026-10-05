# Offline authoring only

This folder is NOT imported by gameplay or the review page.
Final reviewed PNGs under `grib/mushroom-snake-effects-v1/assets/` are the
visual source of truth. The exporter is not a runtime dependency.

Original high-resolution sprite masters are created with the built-in
image-generation tool, using the prompt set saved beside this file.
Existing Forest artwork is style/palette guidance only; no pixels are
extracted, traced or copied into new pickup assets.

Native field export uses uniform contain fitting, nearest-neighbour raster
sampling, explicit alpha and limited palettes. The 24px LOD artwork has its
own hand-authored native clusters and silhouettes; it is not a reduced field
sprite. HUD reduction and authored idle highlights use the original new PNGs.

The review page reads PNG files only. Silhouette and grayscale conversions
are diagnostic derivatives, not game-art substitutes.
