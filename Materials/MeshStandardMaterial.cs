﻿// Decompiled with JetBrains decompiler
// Type: Blazor3D.Materials.MeshStandardMaterial
// Assembly: Blazor3D, Version=0.1.24.0, Culture=neutral, PublicKeyToken=null
// MVID: 8589B0D0-D62F-4099-9D8A-332F65D16B15
// Assembly location: Blazor3D.dll

using BlazorThreeJS.Textures;



namespace BlazorThreeJS.Materials
{
    public sealed class MeshStandardMaterial : Material
    {
        public MeshStandardMaterial()
          : base(nameof(MeshStandardMaterial))
        {
        }

        public string Color { get; set; } = "orange";

        public bool FlatShading { get; set; }

        public double Metalness { get; set; }

        public double Roughness { get; set; } = 1;

        public bool Wireframe { get; set; }

        public Texture Map { get; set; } = new Texture();
    }
}
