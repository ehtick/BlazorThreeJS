﻿// Decompiled with JetBrains decompiler
// Type: Blazor3D.Viewers.Viewer
// Assembly: Blazor3D, Version=0.1.24.0, Culture=neutral, PublicKeyToken=null
// MVID: 8589B0D0-D62F-4099-9D8A-332F65D16B15
// Assembly location: Blazor3D.dll

using System.Text.Json;
using System.Text.Json.Serialization;

using BlazorThreeJS.Controls;
using BlazorThreeJS.Core;

using BlazorThreeJS.Lights;
using BlazorThreeJS.Maths;

using BlazorThreeJS.Settings;
using BlazorThreeJS.Solutions;
using FoundryRulesAndUnits.Extensions;
using Microsoft.AspNetCore.Components;
using Microsoft.AspNetCore.Components.Rendering;
using Microsoft.JSInterop;

namespace BlazorThreeJS.Viewers
{

    public class ViewerThreeD : ComponentBase, IAsyncDisposable
    {
        private bool HasRendered = false;
        [Inject] private IJSRuntime? JsRuntime { get; set; }
        [Inject] private IThreeDService? RenderService { get; set; }

        [Parameter,EditorRequired] public string SceneName { get; set; } = "Viewer3D";

        private JsonSerializerOptions JSONOptions { get; set; } = new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
            DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull,
            WriteIndented = true,
            IncludeFields = true,
            IgnoreReadOnlyFields = true
        };

        private static Dictionary<string, Button3D> Buttons { get; set; } = new();
        

        private ViewerSettings _viewingSettings = null!;
        private Scene3D _activeScene = null!;

        [Parameter]
        public ViewerSettings ViewerSettings
        { 
            get => ComputeViewingSettings();
            set => _viewingSettings = value;
        }

        [Parameter]
        public Scene3D ActiveScene 
        { 
            get => ComputeActiveScene();
            set => _activeScene = value;
        }


        [Parameter] public int CanvasWidth { get; set; } = 1000;
        [Parameter] public int CanvasHeight { get; set; } = 800;

        public OrbitControls OrbitControls { get; set; } = new OrbitControls();

        protected override void BuildRenderTree(RenderTreeBuilder builder)
        {
            builder.OpenElement(0, "div");
            builder.AddAttribute(1, "class", "viewer3dContainer");
            builder.AddAttribute(2, "id", this.SceneName);
           // __builder.AddAttribute(3, "b-h6holr0slw");
            builder.CloseElement();
        }

        private ViewerSettings ComputeViewingSettings()
        {
            if (_viewingSettings != null)
                return _viewingSettings;
            
            _viewingSettings = new ViewerSettings()
            {
                containerId = ComputeActiveScene().Title,
                CanSelect = true,  // default is false
                SelectedColor = "black",
                Width = CanvasWidth,
                Height = CanvasHeight,
                WebGLRendererSettings = new WebGLRendererSettings()
                {
                    Antialias = false
                }
            };

 
            return _viewingSettings;
        }

        public Scene3D GetActiveScene()
        {
            return ComputeActiveScene();
        }

        private Scene3D ComputeActiveScene()
        {
            if (_activeScene != null)
                return _activeScene;

            _activeScene = Scene3D.EstablishScene(SceneName, JsRuntime!, (scene) =>
            {
                var ambient = new AmbientLight()
                {
                    Name = "Ambient Light",
                    Uuid = Guid.NewGuid().ToString(),
                };
                scene.AddChild(ambient);

                var point = new PointLight()
                {
                    Name = "Point Light",
                    Uuid = Guid.NewGuid().ToString(),
                    Transform = new Transform3() {
                        Position = new Vector3()
                        {
                            X = 1f,
                            Y = 3f,
                            Z = 0.0f
                        }
                    }
                };
                scene.AddChild(point);
            });

            return _activeScene;
        }

        public string ResolveFunction(string functionName)
        {
            //return $"{jsNamespace}.{functionName}";
            $"BlazorThreeJS.{functionName}".WriteInfo();
            return $"BlazorThreeJS.{functionName}";
        }

        protected override async Task OnAfterRenderAsync(bool firstRender)
        {

            if (firstRender)
            {
                HasRendered = true;

                var scene = GetActiveScene();
                RenderService?.SetActiveScene(scene);


                var dto = new SceneDTO()
                {
                    Scene = scene,
                    ViewerSettings = ViewerSettings,
                    Camera = scene.Camera,
                    OrbitControls = OrbitControls
                };

                //this is all about having a seperate namespace in javascript to render
                //more than one view
                var functionName = ResolveFunction("Initialize3DViewer");

                try
                {
                    string json = JsonSerializer.Serialize<SceneDTO>(dto, JSONOptions);
                    //$"ViewerThreeD calling {functionName} with {json}".WriteInfo();
                    //WriteToFolder("Data", "ViewerThreeD_OnAfterRenderAsync.json", json);  
                    await JsRuntime!.InvokeVoidAsync(functionName, (object)json);
                }
                catch (System.Exception ex)
                {
                    $"ViewerThreeD Error {ex.Message} OnAfterRenderAsync".WriteError();
                }
                            
            }
            await base.OnAfterRenderAsync(firstRender);

        }


        public async ValueTask DisposeAsync()
        {
            try
            {
                //$"ViewerThreeD [{SceneName}] TRY DisposeAsync".WriteWarning();
                if (!HasRendered)
                    return;
                    
                $"ViewerThreeD [{SceneName}] DisposeAsync".WriteInfo();
                RenderService?.SetActiveScene(null!);
                
                
                var functionName = ResolveFunction("Finalize3DViewer");
                await JsRuntime!.InvokeVoidAsync(functionName);
            }
            catch (Exception ex)
            {
                $"ViewerThreeD DisposeAsync Exception {ex.Message}".WriteError();
            }
        }

        public string WriteToFolder(string folder, string filename, string result)
        {
            try
            {
                FileHelpers.WriteData(folder, filename, result);
                return result;
            }
            catch (Exception ex)
            {
                return ex.Message;
            }
        }

        private void PopulateButtonsDict()
        {
            ViewerThreeD.Buttons.Clear();
            var menus = ActiveScene.GetAllChildren().FindAll((item) => item.Type == "Menu");

            foreach (var menu in menus)
            {
                foreach (var button in ((PanelMenu3D)menu).Buttons)
                {
                    var uuid = button.Uuid!;
                    $"From FoundryBlazor Button UUID={uuid}".WriteInfo();
                    if (!ViewerThreeD.Buttons.ContainsKey(uuid)) 
                        ViewerThreeD.Buttons.Add(uuid, button);
                }
            }
            //Console.WriteLine($"PopulateButtonsDict menus Count ={menus.Count}");
            //Console.WriteLine($"ViewerThreeD.Buttons Count ={ViewerThreeD.Buttons.Count}");
        }


        // [JSInvokable]
        // public static void ReceiveSelectedObjectUUID(string uuid, Vector3 size)
        // {

        //     $"ReceiveSelectedObjectUUID size={size.X}, {size.Y}, {size.Z}".WriteInfo();

        //     try
        //     {
        //         var item = LoadedModels[uuid];
        //         $"LoadedModels {uuid} item={item}".WriteInfo();
        //         if (item != null)
        //         {
        //             //item.ComputedSize = size;
        //             //item.OnClick.Invoke(item);
        //         }
        //         else
        //         {
        //             $"uuid={uuid} not found in LoadedModels".WriteError();
        //         }
        //     }
        //     catch (Exception ex)
        //     {
        //         $"uuid={uuid} problem (could be a problem in onClick callback). Message={ex.Message}".WriteError();
        //     }

        // }


        [JSInvokable]
        public static Task OnClickButton(string uuid)
        {
            Console.WriteLine($"After OnClickButton, ViewerThreeD.Buttons ContainsKey ={ViewerThreeD.Buttons.ContainsKey(uuid)}");

            if (ViewerThreeD.Buttons.ContainsKey(uuid))
            {
                var button = ViewerThreeD.Buttons[uuid];
                var parms = new List<String>();
                button.OnClick?.Invoke(button);
            }
            return Task.CompletedTask;
        }

        // public static Object3D? GetObjectByUuid(string uuid, List<Object3D> children) 
        // {
        //     return ChildrenHelper.GetObjectByUuid(uuid, children);
        // }




        // private void OnObjectSelectedStatic(Object3DStaticArgs e)
        // {
        //     if (!(this.ViewerSettings.containerId == e.ContainerId))
        //         return;


        //     ObjectLoaded?.Invoke(new Object3DArgs() { UUID = e.UUID });
        // }

        // private void OnObjectLoadedStatic(Object3DStaticArgs e)
        // {
        //     if (!(this.ViewerSettings.containerId == e.ContainerId))
        //         return;

        //     this.ObjectLoadedPrivate?.Invoke(new Object3DArgs()
        //     {
        //         UUID = e.UUID
        //     });


        //     this.ObjectLoaded?.Invoke(new Object3DArgs()
        //     {
        //         UUID = e.UUID
        //     });

        // }

        // private List<Object3D> ParseChildren(JsonArray? source)
        // {
        //     var children = new List<Object3D>();
        //     if (source == null)
        //         return children;

        //     foreach (var child in source)
        //     {
        //         if (child is JsonNode jobject)
        //         {
        //             var name = jobject["name"]?.GetValue<string>() ?? string.Empty;
        //             var uuid = jobject["uuid"]?.GetValue<string>() ?? string.Empty;
        //             var type = jobject["type"]?.GetValue<string>() ?? string.Empty;
        //             var children1 = this.ParseChildren(jobject["children"]?.AsArray());

        //             if (type == "Mesh")
        //             {
        //                 var mesh = new Mesh()
        //                 {
        //                     Name = name,
        //                     Uuid = Guid.Parse(type)
        //                 };
        //                 children1.Add((Object3D)mesh);
        //             }
        //             if (type == "Group")
        //             {
        //                 var group = new Group3D()
        //                 {
        //                     Name = name,
        //                     Uuid = Guid.Parse(type)
        //                 };

        //                 group.AddRange(children1);
        //             }
        //         }
        //     }
        //     return children;
        // }

        // private async Task OnObjectLoadedPrivate(Object3DArgs e)
        // {
        //     var functionName = Resolve("getSceneItemByGuid");
        //     var options = UnitSpec.JsonHydrateOptions(false);
        //     string json = await JsRuntime!.InvokeAsync<string>(functionName, (object)e.UUID);


        //     var jobject = JsonNode.Parse(json);
        //     if (jobject == null)
        //         return;

        //     var name = jobject["name"]?.GetValue<string>() ?? string.Empty;
        //     var uuid = jobject["uuid"]?.GetValue<string>() ?? string.Empty;
        //     var type = jobject["type"]?.GetValue<string>() ?? string.Empty;
        //     var children = this.ParseChildren(jobject["children"]?.AsArray());

        //     if (type.Matches("Group"))
        //     {
        //         var group = new Group3D()
        //         {
        //             Name = name,
        //             Uuid = Guid.Parse(uuid),
        //         };

        //         group.AddRange(children);
        //         ActiveScene.Add(group);
        //     }

        //     if (type.Matches("Mesh"))
        //     {

        //         var mesh = new Mesh()
        //         {
        //             Name = name,
        //             Uuid = Guid.Parse(uuid),
        //         };

        //         mesh.AddRange(children);
        //         ActiveScene.Add(mesh);
        //     }

        //     this.ObjectLoaded?.Invoke(new Object3DArgs()
        //     {
        //         UUID = e.UUID
        //     });
        // }







    }
}
