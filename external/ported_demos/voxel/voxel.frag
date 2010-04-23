varying vec2 texCoord;

uniform sampler2D tileTextures;
//input image1 voxelData;

uniform mat3 cameraRotation;
uniform vec3 cameraCenter;
uniform float focalDistance;
uniform float voxelSize;
//uniform vec2 atlasTextureSize;
//uniform vec2 textureSize;
//uniform vec2 textureColumnsRows;

void main()
{
    gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);

    vec3 coord = vec3(texCoord.x, texCoord.y, 0.0);

    //vec3 rayPosition = ((vec3(640.0, 480.0, 0.0) / 2.0 - coord) / vec3(640.0, 640.0, 1.0));
    vec3 rayPosition = ((vec3(0.0, 640.0, 480.0) / 2.0 - vec3(0.0, coord.x, coord.y)) / vec3(1.0, 640.0, 640.0)) * vec3(0.0, 0.2, 0.2);
    vec3 rayDirection = cameraRotation * normalize(rayPosition - vec3(-focalDistance, 0.0, 0.0));
    rayPosition = cameraRotation * rayPosition;
    rayPosition += cameraCenter;
    ivec3 voxel = ivec3(rayPosition / voxelSize);
    ivec3 step = ivec3(sign(rayDirection));

    vec3 offsetTemp = rayPosition - floor(rayPosition / voxelSize) * voxelSize;
    vec3 offsetFromAxis = vec3(step.x == 1 ? voxelSize - offsetTemp.x : offsetTemp.x,
            step.y == 1 ? voxelSize - offsetTemp.y : offsetTemp.y,
            step.z == 1 ? voxelSize - offsetTemp.z : offsetTemp.z);

    if(all(notEqual(rayDirection, vec3(0.0))))
    {
        vec3 tMax = offsetFromAxis / abs(rayDirection);

        vec3 tDelta = voxelSize / abs(rayDirection);

        const ivec3 minBoundary = ivec3(-1, -1, -1);
        const ivec3 maxBoundary = ivec3(10 + 10, 10 + 10, 10 + 10);
        ivec3 boundary = ivec3(step.x == -1 ? minBoundary.x : maxBoundary.x,
                step.y == -1 ? minBoundary.y : maxBoundary.y,
                step.z == -1 ? minBoundary.z : maxBoundary.z);
        int lastCrossed = 0; // 0 = x, 1 = y, 2 = z

        do
        {
            if (tMax.x < tMax.y)
            {
                if(tMax.x < tMax.z)
                {
                    lastCrossed = 0;
                    voxel.x += step.x;
                    if (voxel.x == boundary.x)
                    {
                        break;
                    }
                    tMax.x += tDelta.x;
                }
                else
                {
                    lastCrossed = 2;
                    voxel.z += step.z;
                    if (voxel.z == boundary.z)
                    {
                        break;
                    }
                    tMax.z += tDelta.z;
                }
            }
            else
            {
                if (tMax.y < tMax.z)
                {
                    lastCrossed = 1;
                    voxel.y += step.y;
                    if (voxel.y == boundary.y)
                    {
                        break;
                    }
                    tMax.y += tDelta.y;
                }
                else
                {
                    lastCrossed = 2;
                    voxel.z += step.z;
                    if (voxel.z == boundary.z)
                    {
                        break;
                    }
                    tMax.z += tDelta.z;
                }
            }

            bvec3 voxelEqualToZero = equal(voxel, ivec3(0, 0, 0));
            bvec3 voxelEqualToNine = equal(voxel, ivec3(9, 9, 9));
            //if ((any(voxelEqualToZero) || any(voxelEqualToNine)))
            if ((any(voxelEqualToZero) || any(voxelEqualToNine)) && mod(float(voxel.x + voxel.y + voxel.z), 2.0) == 1.0 || any(equal(voxel, ivec3(0))))
            {
                int lastCrossedVoxel = lastCrossed == 0 ? voxel.x : (lastCrossed == 1 ? voxel.y : voxel.z);
                int lastCrossedStep = lastCrossed == 0 ? step.x : (lastCrossed == 1 ? step.y : step.z);
                float lastCrossedRayPosition = lastCrossed == 0 ? rayPosition.x : (lastCrossed == 1 ? rayPosition.y : rayPosition.z);
                float lastCrossedRayDirection = lastCrossed == 0 ? rayDirection.x : (lastCrossed == 1 ? rayDirection.y : rayDirection.z);
                float offset = float(lastCrossedVoxel + (lastCrossedStep == 1 ? 0 : 1)) * voxelSize - lastCrossedRayPosition;
                //float offset = float(voxel[lastCrossed] + (step[lastCrossed] == 1 ? 0 : 1)) * voxelSize - rayPosition[lastCrossed];
                float depth = offset / lastCrossedRayDirection;
                //gl_FragColor = vec4(1.0 - (depth) / 20.0, 1.0 - (depth) / 20.0, 1.0 - (depth) / 20.0, 1);
                vec2 offsetZeroToOne;
                ivec3 up;
                ivec3 down;
                ivec3 left;
                ivec3 right;
                if (lastCrossed == 0)
                {
                    if (step.x == 1)
                    {
                        float textureIndex = 3.0;
                        offsetZeroToOne = (mod(rayPosition + rayDirection * depth, voxelSize) / voxelSize).yz;
                        offsetZeroToOne.x = 1.0 - offsetZeroToOne.x;
                        vec2 textureCoord = offsetZeroToOne * vec2(0.125, 0.125) + vec2(0.125 * mod(textureIndex, 3.0), 0.125 * floor(textureIndex / 3.0));
                        gl_FragColor = texture2D(tileTextures, textureCoord);
                        //up = ivec3(-1, -1, 0);
                        //down = ivec3(-1, 1, 0);
                        //left = ivec3(-1, 0, 1);
                        //right = ivec3(-1, 0, -1);
                    }
                    else
                    {
                        float textureIndex = 3.0;
                        offsetZeroToOne = (mod(rayPosition + rayDirection * depth, voxelSize) / voxelSize).yz;
                        vec2 textureCoord = offsetZeroToOne * vec2(0.125, 0.125) + vec2(0.125 * mod(textureIndex, 3.0), 0.125 * floor(textureIndex / 3.0));
                        gl_FragColor = texture2D(tileTextures, textureCoord);
                        //up = ivec3(1, -1, 0);
                        //down = ivec3(1, 1, 0);
                        //left = ivec3(1, 0, -1);
                        //right = ivec3(1, 0, 1);
                    }
                }
                else if (lastCrossed == 1)
                {
                    if (step.y == 1)
                    {
                        float textureIndex = 3.0;
                        offsetZeroToOne = (mod(rayPosition + rayDirection * depth, voxelSize) / voxelSize).xz;
                        vec2 textureCoord = offsetZeroToOne * vec2(0.125, 0.125) + vec2(0.125 * mod(textureIndex, 3.0), 0.125 * floor(textureIndex / 3.0));
                        gl_FragColor = texture2D(tileTextures, textureCoord);
                        //up = ivec3(0, -1, -1);
                        //down = ivec3(0, -1, 1);
                        //left = ivec3(-1, -1, 0);
                        //right = ivec3(1, -1, 0);
                    }
                    else
                    {
                        float textureIndex = 3.0;
                        offsetZeroToOne = (mod(rayPosition + rayDirection * depth, voxelSize) / voxelSize).xz;
                        offsetZeroToOne.x = 1.0 - offsetZeroToOne.x;
                        vec2 textureCoord = offsetZeroToOne * vec2(0.125, 0.125) + vec2(0.125 * mod(textureIndex, 3.0), 0.125 * floor(textureIndex / 3.0));
                        gl_FragColor = texture2D(tileTextures, textureCoord);
                        //up = ivec3(0, 1, -1);
                        //down = ivec3(0, 1, 1);
                        //left = ivec3(-1, 1, 0);
                        //right = ivec3(1, 1, 0);
                    }
                }
                else
                {
                    if (step.z == 1)
                    {
                        float textureIndex = 2.0;
                        offsetZeroToOne = (mod(rayPosition + rayDirection * depth, voxelSize) / voxelSize).xy;
                        offsetZeroToOne.y = 1.0 - offsetZeroToOne.y;
                        vec2 textureCoord = offsetZeroToOne * vec2(0.125, 0.125) + vec2(0.125 * mod(textureIndex, 3.0), 0.125 * floor(textureIndex / 3.0));
                        gl_FragColor = texture2D(tileTextures, textureCoord);
                        //up = ivec3(0, -1, -1);
                        //down = ivec3(0, 1, -1);
                        //left = ivec3(-1, 0, -1);
                        //right = ivec3(1, 0, -1);
                    }
                    else
                    {
                        float textureIndex = 1.0;
                        offsetZeroToOne = (mod(rayPosition + rayDirection * depth, voxelSize) / voxelSize).xy;
                        vec2 textureCoord = offsetZeroToOne * vec2(0.125, 0.125) + vec2(0.125 * mod(textureIndex, 3.0), 0.125 * floor(textureIndex / 3.0));
                        gl_FragColor = texture2D(tileTextures, textureCoord);
                        //up = ivec3(0, -1, 1);
                        //down = ivec3(0, 1, 1);
                        //left = ivec3(1, 0, 1);
                        //right = ivec3(-1, 0, 1);
                    }
                }
                /*
                   voxelEqualToZero = equal(voxel + up, ivec3(0, 0, 0));
                   voxelEqualToNine = equal(voxel + up, ivec3(9, 9, 9));
                   if ((any(voxelEqualToZero) || any(voxelEqualToNine)) && mod(float(voxel.x + voxel.y + voxel.z + up.x + up.y + up.z), 2.0) == 1.0)
                   {
                   if (offsetZeroToOne.y < 0.1)
                   {
                   gl_FragColor *= offsetZeroToOne.y * 5.0 + 0.5;
                   }
                   }

                   voxelEqualToZero = equal(voxel + down, ivec3(0, 0, 0));
                   voxelEqualToNine = equal(voxel + down, ivec3(9, 9, 9));
                   if ((any(voxelEqualToZero) || any(voxelEqualToNine)) && mod(float(voxel.x + voxel.y + voxel.z + down.x + down.y + down.z), 2.0) == 1.0)
                   {
                   if (offsetZeroToOne.y > 0.9)
                   {
                   offsetZeroToOne.y = offsetZeroToOne.y > 0.5 ? 1.0 - offsetZeroToOne.y : offsetZeroToOne.y;
                   gl_FragColor *= offsetZeroToOne.y * 5.0 + 0.5;
                   }
                   }

                   voxelEqualToZero = equal(voxel + left, ivec3(0, 0, 0));
                   voxelEqualToNine = equal(voxel + left, ivec3(9, 9, 9));
                   if ((any(voxelEqualToZero) || any(voxelEqualToNine)) && mod(float(voxel.x + voxel.y + voxel.z + left.x + left.y + left.z), 2.0) == 1.0)
                   {
                   if (offsetZeroToOne.x < 0.1)
                   {
                   gl_FragColor *= offsetZeroToOne.x * 5.0 + 0.5;
                   }
                   }

                   voxelEqualToZero = equal(voxel + right, ivec3(0, 0, 0));
                   voxelEqualToNine = equal(voxel + right, ivec3(9, 9, 9));
                   if ((any(voxelEqualToZero) || any(voxelEqualToNine)) && mod(float(voxel.x + voxel.y + voxel.z + right.x + right.y + right.z), 2.0) == 1.0)
                   {
                   if (offsetZeroToOne.x > 0.9)
                   {
                   offsetZeroToOne.x = offsetZeroToOne.x > 0.5 ? 1.0 - offsetZeroToOne.x : offsetZeroToOne.x;
                   gl_FragColor *= offsetZeroToOne.x * 5.0 + 0.5;
                   }
                   }
                 */
                break;
            }
        } while (true);
    }
    else
    {
        gl_FragColor = vec4(1, 0, 1, 1);
    }

}
