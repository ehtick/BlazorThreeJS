﻿// Decompiled with JetBrains decompiler
// Type: Blazor3D.Helpers.PolarGridHelper
// Assembly: Blazor3D, Version=0.1.24.0, Culture=neutral, PublicKeyToken=null
// MVID: 8589B0D0-D62F-4099-9D8A-332F65D16B15
// Assembly location: Blazor3D.dll

using BlazorThreeJS.Core;



namespace BlazorThreeJS.Helpers
{
    public class PolarGridHelper : Object3D
    {
        public PolarGridHelper()
          : base(nameof(PolarGridHelper))
        {
        }

        public PolarGridHelper(
          double radius = 10.0,
          int radials = 16,
          int circles = 8,
          int divisions = 64,
          string color1 = "0x444444",
          string color2 = "0x888888")
          : this()
        {
            this.Radius = radius;
            this.Radials = radials;
            this.Circles = circles;
            this.Divisions = divisions;
            this.Color1 = color1;
            this.Color2 = color2;
        }

        public double Radius { get; set; } = 10.0;

        public int Radials { get; set; } = 16;

        public int Circles { get; set; } = 8;

        public int Divisions { get; set; } = 64;

        public string Color1 { get; set; } = "0x444444";

        public string Color2 { get; set; } = "0x888888";
    }
}
