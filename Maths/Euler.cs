﻿// Decompiled with JetBrains decompiler
// Type: Blazor3D.Maths.Euler
// Assembly: Blazor3D, Version=0.1.24.0, Culture=neutral, PublicKeyToken=null
// MVID: 8589B0D0-D62F-4099-9D8A-332F65D16B15
// Assembly location: Blazor3D.dll



namespace BlazorThreeJS.Maths
{
    public class Euler
    {
        public double X { get; set; } = 0;

        public double Y { get; set; } = 0;

        public double Z { get; set; } = 0;

        public string Order { get; set; } = "XYZ";

        public Euler()
        {
        }

        public Euler(double x, double y, double z)
        {
            Set(x, y, z);
        }
        public Euler(double x, double y, double z, string order):this(x,y,z)
        {
            Order = order;
        }

        public Euler Set(double x, double y, double z)
        {

            X = x;
            Y = y;
            Z = z;
            return this;
        }
    }
}
