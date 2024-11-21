﻿using BlazorThreeJS.Core;
using BlazorThreeJS.Geometires;
using BlazorThreeJS.Materials;
using FoundryRulesAndUnits.Models;



namespace BlazorThreeJS.Objects;

public class Mesh3D : Object3D
{
    public Mesh3D()
      : base("Mesh")
    {
    }

    public Material Material { get; set; } = (Material)new MeshStandardMaterial();

    public BufferGeometry Geometry { get; set; } = (BufferGeometry)new BoxGeometry();

    public override IEnumerable<ITreeNode> GetTreeChildren()
    {
        var result = base.GetTreeChildren().ToList();
        //result.Add(Geometry);
        //result.Add(Material);
        return result;
    }


}

