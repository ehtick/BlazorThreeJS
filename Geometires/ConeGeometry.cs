﻿// Decompiled with JetBrains decompiler
// Type: Blazor3D.Geometires.ConeGeometry
// Assembly: Blazor3D, Version=0.1.24.0, Culture=neutral, PublicKeyToken=null
// MVID: 8589B0D0-D62F-4099-9D8A-332F65D16B15
// Assembly location: Blazor3D.dll

using BlazorThreeJS.Core;

namespace BlazorThreeJS.Geometires
{
    public sealed class ConeGeometry : BufferGeometry
    {
        public ConeGeometry()
          : base(nameof(ConeGeometry))
        {
        }

        public ConeGeometry(
          double radius = 1,
          double height = 1,
          int radialSegments = 8,
          int heightSegments = 1,
          bool openEnded = false,
          double thetaStart = 0.0f,
          double thetaLength = 6.28318548)
          : this()
        {
            this.Radius = radius;
            this.Height = height;
            this.RadialSegments = radialSegments;
            this.HeightSegments = heightSegments;
            this.OpenEnded = openEnded;
            this.ThetaStart = thetaStart;
            this.ThetaLength = thetaLength;
        }

        public double Radius { get; set; } = 1;

        public double Height { get; set; } = 1;

        public int RadialSegments { get; set; } = 8;

        public int HeightSegments { get; set; } = 1;

        public bool OpenEnded { get; set; }

        public double ThetaStart { get; set; }

        public double ThetaLength { get; set; } = 6.28318548;
    }
}
